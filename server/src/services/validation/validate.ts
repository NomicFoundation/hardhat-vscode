import { Diagnostic, TextDocumentChangeEvent } from "vscode-languageserver";
import { TextDocument } from "vscode-languageserver-textdocument";
import { isHardhatProject } from "@analyzer/HardhatProject";
import { decodeUriAndRemoveFilePrefix } from "../../utils/index";
import { ServerState, WorkerProcess } from "../../types";
import { getOpenDocumentsInProject } from "../../queries/getOpenDocumentsInProject";
import { DiagnosticConverter } from "./DiagnosticConverter";

export async function validate(
  serverState: ServerState,
  change: TextDocumentChangeEvent<TextDocument>
) {
  const internalUri = decodeUriAndRemoveFilePrefix(change.document.uri);

  const solFileEntry = serverState.solFileIndex[internalUri];

  if (solFileEntry === undefined) {
    serverState.logger.error(
      new Error(
        `Could not send to valiation process, uri is not indexed: ${internalUri}`
      )
    );

    return;
  }

  if (!isHardhatProject(solFileEntry.project)) {
    serverState.logger.trace(
      `No project associated with file, change not propagated to validation process: ${change.document.uri}`
    );

    return;
  }

  const workerProcess: WorkerProcess | undefined =
    serverState.workerProcesses[solFileEntry.project.basePath];

  if (workerProcess === undefined) {
    serverState.logger.error(
      `No worker process for project: ${solFileEntry.project.basePath}`
    );

    return;
  }

  const openDocuments = getOpenDocumentsInProject(
    serverState,
    solFileEntry.project
  );

  const documentText = change.document.getText();

  const { errors } = await workerProcess.validate({
    uri: internalUri,
    documentText,
    openDocuments: openDocuments.map((openDoc) => ({
      uri: decodeUriAndRemoveFilePrefix(openDoc.uri),
      documentText: openDoc.getText(),
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
}
