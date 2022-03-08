import * as path from "path";
import { Analyzer } from "@analyzer/index";
import { TextDocument, Diagnostic } from "@common/types";
import { CompilerProcess } from "./HardhatProcess";
import {
  GET_DOCUMENT_EVENT,
  SOLIDITY_COMPILE_CONFIRMATION_EVENT,
} from "./events";
import { DiagnosticConverter } from "./DiagnosticConverter";
import { Logger } from "@utils/Logger";

export interface ValidationJob {
  run(
    uri: string,
    document: TextDocument,
    unsavedDocuments: TextDocument[]
  ): Promise<{ [uri: string]: Diagnostic[] }>;
  close(): void;
}

export class SolidityValidation {
  analyzer: Analyzer;
  compilerProcessFactory: (rootPath: string, uri: string) => CompilerProcess;
  diagnosticConverter: DiagnosticConverter;

  constructor(
    analyzer: Analyzer,
    compilerProcessFactory: (rootPath: string, uri: string) => CompilerProcess
  ) {
    this.analyzer = analyzer;
    this.compilerProcessFactory = compilerProcessFactory;
    this.diagnosticConverter = new DiagnosticConverter(this.analyzer);
  }

  public getValidationJob(logger: Logger): ValidationJob {
    let isCompilerDownloaded = true;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let canceledResolver: any;
    const canceled = new Promise((resolve) => {
      canceledResolver = resolve;
    });

    return {
      run: async (
        uri: string,
        document: TextDocument,
        unsavedDocuments: TextDocument[]
      ): Promise<{ [uri: string]: Diagnostic[] }> => {
        const rootPath = this.analyzer.rootPath;

        if (!rootPath) {
          logger.error(new Error("Validation failed, no rootPath specified"));
          return {};
        }

        const hardhatProcess = this.compilerProcessFactory(rootPath, uri);

        const {
          hardhatConfigFileExistPromise,
          compilerDownloadedPromise,
          solidityCompilePromise,
        } = hardhatProcess.init();

        const _run = async (
          uri: string,
          document: TextDocument,
          unsavedDocuments: TextDocument[]
        ): Promise<{ [uri: string]: Diagnostic[] }> => {
          hardhatProcess.send({
            type: GET_DOCUMENT_EVENT,
            data: {
              uri: path.normalize(uri),
              documentText: document.getText(),
              unsavedDocuments: unsavedDocuments.map((unsavedDocument) => {
                return {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  uri: (unsavedDocument.uri as any).path,
                  documentText: unsavedDocument.getText(),
                };
              }),
            },
          });

          const hardhatConfigFileExist =
            (await hardhatConfigFileExistPromise) as boolean;
          if (!hardhatConfigFileExist) {
            return {};
          }

          isCompilerDownloaded = (await compilerDownloadedPromise) as boolean;
          hardhatProcess.send({ type: SOLIDITY_COMPILE_CONFIRMATION_EVENT });

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const output: any = await solidityCompilePromise;

          if (!output || output.errors.length === 0) {
            return {};
          }

          const diagnostics: { [uri: string]: Diagnostic[] } =
            this.diagnosticConverter.convertErrors(document, output.errors);

          return diagnostics;
        };

        try {
          const timeout = new Promise((resolve, reject) => {
            const id = setTimeout(() => {
              clearTimeout(id);
              reject("Validation timed out");
            }, 60 * 1000);
          });

          const diagnostics = (await Promise.race([
            _run(uri, document, unsavedDocuments),
            canceled,
            timeout,
          ])) as Promise<{ [uri: string]: Diagnostic[] }>;

          try {
            hardhatProcess.kill();
          } catch (err) {
            logger.error(err);
          }

          return diagnostics;
        } catch (err) {
          try {
            hardhatProcess.kill();
          } catch (err) {
            logger.error(err);
          }

          return Promise.resolve({});
        }
      },

      close: async () => {
        if (!isCompilerDownloaded) {
          return;
        }

        canceledResolver([]);
      },
    } as ValidationJob;
  }
}
