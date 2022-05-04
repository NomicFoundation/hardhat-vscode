import {
  Connection,
  Diagnostic,
  TextDocumentChangeEvent,
} from "vscode-languageserver";
import { TextDocuments } from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";
import { Logger } from "@utils/Logger";
import { DocumentsAnalyzerMap, SolProjectMap } from "@common/types";
import { analyzeDocument } from "@utils/analyzeDocument";
import { isHardhatProject } from "@analyzer/HardhatProject";
import {
  decodeUriAndRemoveFilePrefix,
  getUriFromDocument,
} from "../../utils/index";
import { debounce } from "../../utils/debounce";
import { ServerState, WorkerProcess } from "../../types";
import { DiagnosticConverter } from "./DiagnosticConverter";

const debounceAnalyzeDocument: {
  [uri: string]: (
    documents: TextDocuments<TextDocument>,
    uri: string,
    projects: SolProjectMap,
    solFileIndex: DocumentsAnalyzerMap,
    logger: Logger
  ) => void;
} = {};

const debouncedPropagate: {
  // eslint-disable-next-line @typescript-eslint/ban-types
  [uri: string]: Function;
} = {};

interface UnsavedDocumentType {
  uri: string;
  languageId: string;
  version: number;
  content: string;
}

export function onDidChangeContent(serverState: ServerState) {
  return (change: TextDocumentChangeEvent<TextDocument>) => {
    const { logger } = serverState;

    logger.trace("onDidChangeContent");

    try {
      if (debounceAnalyzeDocument[change.document.uri] === undefined) {
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

      propagateToValidationWorker(serverState, change);
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

function propagateToValidationWorker(
  serverState: ServerState,
  change: TextDocumentChangeEvent<TextDocument>
) {
  if (!(change.document.uri in debouncedPropagate)) {
    debouncedPropagate[change.document.uri] = debounce(async () => {
      const normalizedUri = decodeUriAndRemoveFilePrefix(change.document.uri);

      const solFile =
        serverState.solFileIndex[
          decodeUriAndRemoveFilePrefix(change.document.uri)
        ];

      if (!solFile) {
        serverState.logger.error(
          new Error(
            `Could not send to valiation process, uri is not indexed: ${change.document.uri}`
          )
        );

        return;
      }

      if (!isHardhatProject(solFile.project)) {
        serverState.logger.trace(
          `No project associated with file, change not propagated to validation process: ${change.document.uri}`
        );

        return;
      }

      const workerProcess: WorkerProcess | undefined =
        serverState.workerProcesses[solFile.project.basePath];

      if (workerProcess === undefined) {
        serverState.logger.error(
          `No worker process for project: ${solFile.project.basePath}`
        );

        return;
      }

      const unsavedDocuments = await getUnsavedDocuments(
        serverState.connection
      );

      const documentText = change.document.getText();

      const { errors } = await workerProcess.validate({
        uri: normalizedUri,
        documentText,
        unsavedDocuments: unsavedDocuments.map((unsavedDocument) => ({
          uri: unsavedDocument.uri,
          documentText: unsavedDocument.getText(),
        })),
      });

      const document = change.document;

      if (errors.length === 0) {
        serverState.connection.sendDiagnostics({
          uri: document.uri,
          diagnostics: [],
        });

        return;
      }

      const diagnosticConverter = new DiagnosticConverter(serverState.logger);

      const diagnostics: { [uri: string]: Diagnostic[] } =
        diagnosticConverter.convertErrors(change.document, errors);

      for (const diagnosticUri of Object.keys(diagnostics)) {
        if (document.uri.includes(diagnosticUri)) {
          serverState.connection.sendDiagnostics({
            uri: document.uri,
            diagnostics: diagnostics[diagnosticUri],
          });
        }
      }
    }, 250);
  }

  const propagate = debouncedPropagate[change.document.uri];

  propagate(change);
}
