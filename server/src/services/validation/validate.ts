import { Diagnostic, TextDocumentChangeEvent } from "vscode-languageserver";
import { TextDocument } from "vscode-languageserver-textdocument";
import { isHardhatProject } from "@analyzer/HardhatProject";
import { decodeUriAndRemoveFilePrefix } from "../../utils/index";
import {
  HardhatPreprocessingError,
  ServerState,
  ValidationCompleteMessage,
  ValidationFail,
  WorkerProcess,
} from "../../types";
import { getOpenDocumentsInProject } from "../../queries/getOpenDocumentsInProject";
import { DiagnosticConverter } from "./DiagnosticConverter";
import { convertHardhatErrorToDiagnostic } from "./convertHardhatErrorToDiagnostic";

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

  const completeMessage = await workerProcess.validate({
    uri: internalUri,
    documentText,
    openDocuments: openDocuments.map((openDoc) => ({
      uri: decodeUriAndRemoveFilePrefix(openDoc.uri),
      documentText: openDoc.getText(),
    })),
  });

  sendResults(serverState, change, completeMessage);
}

function sendResults(
  serverState: ServerState,
  change: TextDocumentChangeEvent<TextDocument>,
  completeMessage: ValidationCompleteMessage
) {
  switch (completeMessage.status) {
    case "HARDHAT_ERROR":
      return hardhatPreprocessFail(serverState, change, completeMessage);
    case "VALIDATION_FAIL":
      return validationFail(serverState, change, completeMessage);
    case "VALIDATION_PASS":
      return validationPass(serverState, change);
    default:
      return assertUnknownMessageStatus(completeMessage);
  }
}

function hardhatPreprocessFail(
  serverState: ServerState,
  { document }: TextDocumentChangeEvent<TextDocument>,
  { hardhatErrors }: HardhatPreprocessingError
) {
  const hardhatErrordiagnostics = hardhatErrors
    .map((hh) => convertHardhatErrorToDiagnostic(document, hh))
    .filter((diag): diag is Diagnostic => diag !== null);

  serverState.connection.sendDiagnostics({
    uri: document.uri,
    diagnostics: hardhatErrordiagnostics,
  });
}

function validationPass(
  serverState: ServerState,
  change: TextDocumentChangeEvent<TextDocument>
): void {
  const document = change.document;

  // TODO: send one for each source in complete message
  serverState.connection.sendDiagnostics({
    uri: document.uri,
    diagnostics: [],
  });
}

function validationFail(
  serverState: ServerState,
  change: TextDocumentChangeEvent<TextDocument>,
  message: ValidationFail
): void {
  const document = change.document;
  const diagnosticConverter = new DiagnosticConverter(serverState.logger);

  const diagnostics: { [uri: string]: Diagnostic[] } =
    diagnosticConverter.convertErrors(change.document, message.errors);

  for (const diagnosticUri of Object.keys(diagnostics)) {
    if (document.uri.includes(diagnosticUri)) {
      serverState.connection.sendDiagnostics({
        uri: document.uri,
        diagnostics: diagnostics[diagnosticUri],
      });
    }
  }
}

function assertUnknownMessageStatus(completeMessage: never) {
  throw new Error(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    `Unrecognized message status: ${(completeMessage as any)?.status}`
  );
}
