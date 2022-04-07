import {
  Connection,
  TextDocumentChangeEvent,
  WorkspaceFolder,
} from "vscode-languageserver";
import { TextDocuments } from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";
import { getUriFromDocument } from "../../utils/index";
import { debounce } from "../../utils/debounce";
import { ServerState } from "../../types";
import { Logger } from "@utils/Logger";
import { SolidityValidation, ValidationJob } from "./SolidityValidation";

import { findProjectBasePathFor } from "@utils/findProjectBasePathFor";
import { DocumentsAnalyzerMap } from "@common/types";
import { analyzeDocument } from "@utils/analyzeDocument";

const debounceAnalyzeDocument: {
  [uri: string]: (
    documents: TextDocuments<TextDocument>,
    uri: string,
    workspaceFolders: WorkspaceFolder[],
    solFileIndex: DocumentsAnalyzerMap,
    logger: Logger
  ) => void;
} = {};

const debounceValidateDocument: {
  [uri: string]: (
    validationJob: ValidationJob,
    connection: Connection,
    uri: string,
    projectBasePath: string | null,
    document: TextDocument,
    logger: Logger
  ) => void;
} = {};

type UnsavedDocumentType = {
  uri: string;
  languageId: string;
  version: number;
  content: string;
};

export function onDidChangeContent(serverState: ServerState) {
  return (change: TextDocumentChangeEvent<TextDocument>) => {
    const { logger } = serverState;

    logger.trace("onDidChangeContent");

    try {
      const projectBasePath = findProjectBasePathFor(
        serverState,
        change.document.uri
      );

      if (!debounceAnalyzeDocument[change.document.uri]) {
        debounceAnalyzeDocument[change.document.uri] = debounce(
          analyzeFunc,
          500
        );
      }

      debounceAnalyzeDocument[change.document.uri](
        serverState.documents,
        change.document.uri,
        serverState.workspaceFolders,
        serverState.solFileIndex,
        serverState.logger
      );

      // ------------------------------------------------------------------------

      if (!debounceValidateDocument[change.document.uri]) {
        debounceValidateDocument[change.document.uri] = debounce(
          validateTextDocument,
          500
        );
      }

      const documentURI = getUriFromDocument(change.document);
      const validationJob = new SolidityValidation(
        serverState.compProcessFactory,
        logger
      ).getValidationJob(serverState.telemetry, logger);

      debounceValidateDocument[change.document.uri](
        validationJob,
        serverState.connection,
        documentURI,
        projectBasePath,
        change.document,
        logger
      );
    } catch (err) {
      logger.error(err);
    }
  };
}

function analyzeFunc(
  documents: TextDocuments<TextDocument>,
  uri: string,
  workspaceFolders: WorkspaceFolder[],
  solFileIndex: DocumentsAnalyzerMap,
  logger: Logger
): void {
  logger.trace("debounced onDidChangeContent");

  try {
    const document = documents.get(uri);

    if (!document) {
      return;
    }

    const documentURI = getUriFromDocument(document);

    analyzeDocument(
      { workspaceFolders, solFileIndex, logger },
      document.getText(),
      documentURI
    );
  } catch (err) {
    logger.error(err);
  }
}

async function validateTextDocument(
  validationJob: ValidationJob,
  connection: Connection,
  uri: string,
  projectBasePath: string | null,
  document: TextDocument,
  logger: Logger
): Promise<void> {
  logger.trace("validateTextDocument");

  try {
    const unsavedDocuments = await getUnsavedDocuments(connection);
    const diagnostics = await validationJob.run(
      uri,
      document,
      unsavedDocuments,
      projectBasePath
    );

    // Send the calculated diagnostics to VSCode, but only for the file over which we called validation.
    for (const diagnosticUri of Object.keys(diagnostics)) {
      if (uri.includes(diagnosticUri)) {
        connection.sendDiagnostics({
          uri: document.uri,
          diagnostics: diagnostics[diagnosticUri],
        });

        return;
      }
    }

    connection.sendDiagnostics({
      uri: document.uri,
      diagnostics: [],
    });
  } catch (err) {
    logger.error(err);
  }
}

async function getUnsavedDocuments(
  connection: Connection
): Promise<TextDocument[]> {
  connection.sendNotification("custom/get-unsaved-documents");

  return new Promise((resolve, reject) => {
    // Set up the timeout
    const timeout = setTimeout(() => {
      reject("Timeout on getUnsavedDocuments");
    }, 15000);

    connection.onNotification(
      "custom/get-unsaved-documents",
      (unsavedDocuments: UnsavedDocumentType[]) => {
        const unsavedTextDocuments = unsavedDocuments.map((ud) => {
          return TextDocument.create(
            ud.uri,
            ud.languageId,
            ud.version,
            ud.content
          );
        });

        clearTimeout(timeout);
        resolve(unsavedTextDocuments);
      }
    );
  });
}
