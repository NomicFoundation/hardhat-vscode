import * as path from "path";
import * as childProcess from "child_process";

import {
  TextDocument,
  Diagnostic,
  Range,
  DiagnosticSeverity,
} from "@common/types";
import { validationJobOptions } from "./types";

const GET_DOCUMENT_EVENT = "get_document";
const SOLIDITY_COMPILE_CONFIRMATION_EVENT = "solidity_compile_confirmation";

const COMPILER_DOWNLOADED_EVENT = "compiler_downloaded";
const SOLIDITY_COMPILE_EVENT = "solidity_compile";
const HARDHAT_CONFIG_FILE_EXIST_EVENT = "hardhat_config_file_exist";

export async function hardhatValidator(
  projectRoot: string,
  uri: string,
  document: TextDocument,
  unsavedDocuments: TextDocument[],
  options: validationJobOptions,
  canceled: Promise<any>
): Promise<{ [uri: string]: Diagnostic[] }> {
  // We can start child processes with {detached: true} option so those processes will not be attached
  // to main process but they will go to a new group of processes.
  const child = childProcess.fork(
    path.resolve(__dirname, "hardhatCompile.js"),
    {
      cwd: projectRoot,
      detached: true,
    }
  );

  let hardhatConfigFileExistPromiseResolver: any;
  const hardhatConfigFileExistPromise = new Promise((resolve) => {
    hardhatConfigFileExistPromiseResolver = resolve;
  });

  let compilerDownloadedPromiseResolver: any;
  const compilerDownloadedPromise = new Promise((resolve) => {
    compilerDownloadedPromiseResolver = resolve;
  });

  let solidityCompilePromiseResolver: any;
  const solidityCompilePromise = new Promise((resolve) => {
    solidityCompilePromiseResolver = resolve;
  });

  child.on("message", (data: any) => {
    switch (data.type) {
      case HARDHAT_CONFIG_FILE_EXIST_EVENT:
        hardhatConfigFileExistPromiseResolver(data.exist);
        break;

      case COMPILER_DOWNLOADED_EVENT:
        compilerDownloadedPromiseResolver(data.isCompilerDownloaded);
        break;

      case SOLIDITY_COMPILE_EVENT:
        solidityCompilePromiseResolver(data.output);
        break;

      default:
        break;
    }
  });

  const _run = async (
    uri: string,
    document: TextDocument,
    unsavedDocuments: TextDocument[]
  ): Promise<{ [uri: string]: Diagnostic[] }> => {
    child.send({
      type: GET_DOCUMENT_EVENT,
      data: {
        uri,
        documentText: document.getText(),
        unsavedDocuments: unsavedDocuments.map((unsavedDocument) => {
          return {
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

    options.isCompilerDownloaded = (await compilerDownloadedPromise) as boolean;
    child.send({ type: SOLIDITY_COMPILE_CONFIRMATION_EVENT });

    const output: any = await solidityCompilePromise;

    const diagnostics: { [uri: string]: Diagnostic[] } = {};
    if (output?.errors && output.errors.length > 0) {
      for (const error of output.errors) {
        if (!diagnostics[error.sourceLocation.file]) {
          diagnostics[error.sourceLocation.file] = [];
        }

        diagnostics[error.sourceLocation.file].push(<Diagnostic>{
          code: error.errorCode,
          source: document.languageId,
          severity:
            error.severity === "error"
              ? DiagnosticSeverity.Error
              : DiagnosticSeverity.Warning,
          message: error.message,
          range: Range.create(
            document.positionAt(error.sourceLocation.start),
            document.positionAt(error.sourceLocation.end)
          ),
        });
      }
    }

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

    // Then using process.kill(pid) method on main process we can kill all processes that are in
    // the same group of a child process with the same pid group.
    try {
      child.kill(child.pid);
    } catch (err) {
      // console.error(err);
    }

    return diagnostics;
  } catch (err) {
    try {
      child.kill(child.pid);
    } catch (err) {
      // console.error(err);
    }

    return Promise.resolve({});
  }
}
