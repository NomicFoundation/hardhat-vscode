import { Connection, TextDocumentChangeEvent } from "vscode-languageserver";
import { TextDocuments } from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";
import {
  decodeUriAndRemoveFilePrefix,
  getUriFromDocument,
} from "../../utils/index";
import { debounce } from "../../utils/debounce";
import { ServerState } from "../../types";
import { Logger } from "@utils/Logger";
import { SolidityValidation, ValidationJob } from "./SolidityValidation";

import { findProjectFor } from "@utils/findProjectFor";
import {
  DocumentsAnalyzerMap,
  ISolProject,
  SolProjectMap,
} from "@common/types";
import { analyzeDocument } from "@utils/analyzeDocument";

const debounceAnalyzeDocument: {
  [uri: string]: (
    documents: TextDocuments<TextDocument>,
    uri: string,
    projects: SolProjectMap,
    solFileIndex: DocumentsAnalyzerMap,
    logger: Logger
  ) => void;
} = {};

const debounceValidateDocument: {
  [uri: string]: (
    validationJob: ValidationJob,
    connection: Connection,
    uri: string,
    project: ISolProject,
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
      if (!debounceAnalyzeDocument[change.document.uri]) {
        debounceAnalyzeDocument[change.document.uri] = debounce(
          analyzeFunc,
          500
        );
      }

      debounceAnalyzeDocument[change.document.uri](
        serverState.documents,
        change.document.uri,
        serverState.projects,
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
      const project = findProjectFor(
        serverState,
        decodeUriAndRemoveFilePrefix(change.document.uri)
      );
      const validationJob = new SolidityValidation(
        serverState.compProcessFactory,
        logger
      ).getValidationJob(serverState.telemetry, logger);

      debounceValidateDocument[change.document.uri](
        validationJob,
        serverState.connection,
        documentURI,
        project,
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
  projects: SolProjectMap,
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
      { projects, solFileIndex },
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
  project: ISolProject,
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
      project
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
