import { Diagnostic, TextDocumentChangeEvent } from "vscode-languageserver";
import { TextDocument } from "vscode-languageserver-textdocument";
import { isHardhatProject } from "@analyzer/HardhatProject";
import { decodeUriAndRemoveFilePrefix } from "../../utils/index";
import {
  HardhatPreprocessingError,
  JobCreationError,
  ServerState,
  ValidationCompleteMessage,
  ValidationFail,
  ValidationJobFailureNotification,
  ValidationJobStatusNotification,
  ValidationPass,
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
    projectBasePath: solFileEntry.project.basePath,
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
      return validationPass(serverState, change, completeMessage);
    default:
      return assertUnknownMessageStatus(completeMessage);
  }
}

function hardhatPreprocessFail(
  serverState: ServerState,
  { document }: TextDocumentChangeEvent<TextDocument>,
  { hardhatErrors, projectBasePath }: HardhatPreprocessingError
) {
  const hardhatErrorDiagnostics = hardhatErrors
    .filter((hh) => hh.name === "HardhatError")
    .map((hh) => convertHardhatErrorToDiagnostic(document, hh))
    .filter((diag): diag is Diagnostic => diag !== null);

  serverState.connection.sendDiagnostics({
    uri: document.uri,
    diagnostics: hardhatErrorDiagnostics,
  });

  const compilationJobCreationErrors = hardhatErrors
    .filter(
      (hh): hh is JobCreationError => hh.name === "HardhatJobCreationError"
    )
    .sort((left, right) =>
      left.reason > right.reason ? 1 : right.reason > left.reason ? -1 : 0
    );

  const firstCompilationJobError = compilationJobCreationErrors[0];

  sendValidationProcessProblem(
    serverState,
    projectBasePath,
    firstCompilationJobError
  );
}

function sendValidationProcessProblem(
  serverState: ServerState,
  projectBasePath: string,
  error: JobCreationError
) {
  const data: ValidationJobStatusNotification = jobStatusFrom(
    projectBasePath,
    error
  );

  serverState.connection.sendNotification("custom/validation-job-status", data);
}

function sendValidationProcessSuccess(
  serverState: ServerState,
  projectBasePath: string,
  version: string
) {
  const data: ValidationJobStatusNotification = {
    validationRun: true,
    projectBasePath,
    version,
  };

  serverState.connection.sendNotification("custom/validation-job-status", data);
}

function jobStatusFrom(
  projectBasePath: string,
  error: JobCreationError
): ValidationJobFailureNotification {
  switch (error.reason) {
    case "directly-imports-incompatible-file":
      return {
        validationRun: false,
        projectBasePath,
        reason: error.reason,
        displayText: "directly imports incompatible file",
      };
    case "incompatible-overriden-solc-version":
      return {
        validationRun: false,
        projectBasePath,
        reason: error.reason,
        displayText: "incompatible overriden solc version",
      };
    case "indirectly-imports-incompatible-file":
      return {
        validationRun: false,
        projectBasePath,
        reason: error.reason,
        displayText: "indirectly imports incompatible file",
      };
    case "no-compatible-solc-version-found":
      return {
        validationRun: false,
        projectBasePath,
        reason: error.reason,
        displayText: "no compatibile solc version found",
      };
    default:
      return {
        validationRun: false,
        projectBasePath,
        reason: error.reason,
        displayText: "Unknown failure code",
      };
  }
}

function validationPass(
  serverState: ServerState,
  change: TextDocumentChangeEvent<TextDocument>,
  message: ValidationPass
): void {
  const document = change.document;

  // TODO: send one for each source in complete message
  serverState.connection.sendDiagnostics({
    uri: document.uri,
    diagnostics: [],
  });

  sendValidationProcessSuccess(
    serverState,
    message.projectBasePath,
    message.version
  );
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

  sendValidationProcessSuccess(serverState, message.projectBasePath, "0.0.0");
}

function assertUnknownMessageStatus(completeMessage: never) {
  throw new Error(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    `Unrecognized message status: ${(completeMessage as any)?.status}`
  );
}
