import * as path from "path";
import { TextDocument, Diagnostic, ISolProject } from "@common/types";

import {
  GET_DOCUMENT_EVENT,
  SOLIDITY_COMPILE_CONFIRMATION_EVENT,
} from "./events";
import { DiagnosticConverter } from "./DiagnosticConverter";
import { Logger } from "@utils/Logger";
import { Telemetry } from "telemetry/types";
import { CompilerProcess } from "../../types";
import { HardhatProject } from "@analyzer/HardhatProject";

export interface ValidationJob {
  run(
    uri: string,
    document: TextDocument,
    unsavedDocuments: TextDocument[],
    project: ISolProject
  ): Promise<{ [uri: string]: Diagnostic[] }>;
  close(): void;
}

export class SolidityValidation {
  compilerProcessFactory: (
    project: HardhatProject,
    uri: string,
    logger: Logger
  ) => CompilerProcess;
  diagnosticConverter: DiagnosticConverter;

  constructor(
    compilerProcessFactory: (
      project: HardhatProject,
      uri: string,
      logger: Logger
    ) => CompilerProcess,
    logger: Logger
  ) {
    this.compilerProcessFactory = compilerProcessFactory;
    this.diagnosticConverter = new DiagnosticConverter(logger);
  }

  public getValidationJob(telemetry: Telemetry, logger: Logger): ValidationJob {
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
        unsavedDocuments: TextDocument[],
        project: ISolProject
      ): Promise<{ [uri: string]: Diagnostic[] }> => {
        if (project.type !== "hardhat") {
          logger.trace(`Validation failed, not a hardhat project ${uri}`);

          return {};
        }

        const transaction = telemetry.startTransaction({
          op: "task",
          name: "validation",
        });

        const hardhatProcess = this.compilerProcessFactory(
          project as HardhatProject,
          uri,
          logger
        );

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

          const configFileExistsSpan = transaction.startChild({
            op: "task",
            description: `Find hardhat config file`,
          });

          const hardhatConfigFileExist =
            (await hardhatConfigFileExistPromise) as boolean;

          if (!hardhatConfigFileExist) {
            configFileExistsSpan.setStatus("failed_precondition");
            configFileExistsSpan.finish();
            return {};
          } else {
            configFileExistsSpan.finish();
          }

          const compilerDownloadSpan = transaction.startChild({
            op: "task",
            description: `Download compiler`,
          });

          isCompilerDownloaded = (await compilerDownloadedPromise) as boolean;

          compilerDownloadSpan.finish();

          hardhatProcess.send({ type: SOLIDITY_COMPILE_CONFIRMATION_EVENT });

          const hardhatCompileSpan = transaction.startChild({
            op: "task",
            description: `Hardhat compile`,
          });

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const output: any = await solidityCompilePromise;

          hardhatCompileSpan.finish();

          if (!output || !output.errors || output.errors.length === 0) {
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
          } catch {
            // suppress the kill signal error
          }

          return diagnostics;
        } catch (err) {
          logger.error(err);
          transaction.setStatus("unknown_error");

          try {
            hardhatProcess.kill();
          } catch (err) {
            // suppress the kill signal error
          }

          return Promise.resolve({});
        } finally {
          transaction.finish();
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
