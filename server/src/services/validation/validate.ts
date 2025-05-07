/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Diagnostic,
  DiagnosticSeverity,
  MessageType,
  TextDocumentChangeEvent,
} from "vscode-languageserver";
import { TextDocument, Range } from "vscode-languageserver-textdocument";
import _ from "lodash";
import path from "path";
import { URI } from "vscode-uri";
import { decodeUriAndRemoveFilePrefix, toUnixStyle } from "../../utils/index";
import {
  JobCompletionError,
  ServerState,
  ValidationResult,
  ValidationFail,
  ValidationJobFailureNotification,
  ValidationJobStatusNotification,
  ValidationPass,
  OpenDocuments,
  BuildInputFailed,
  InitializationFailed,
} from "../../types";
import { getOpenDocumentsInProject } from "../../queries/getOpenDocumentsInProject";
import { CompilationDetails } from "../../frameworks/base/CompilationDetails";
import { addFrameworkTag } from "../../telemetry/tags";
import { Project } from "../../frameworks/base/Project";
import { indexSolidityFile } from "../initialization/indexWorkspaceFolders";
import { wildcardDriveLetter } from "../../utils/paths";
import { DiagnosticConverter } from "./DiagnosticConverter";
import { CompilationService } from "./CompilationService";
import { OutputConverter } from "./OutputConverter";

export async function validate(
  serverState: ServerState,
  change: TextDocumentChangeEvent<TextDocument>
): Promise<boolean | null> {
  return serverState.telemetry.trackTiming(
    "validation",
    async (transaction) => {
      // Ensure file is analyzed
      const sourceUri = decodeUriAndRemoveFilePrefix(change.document.uri);
      const solFileEntry =
        serverState.solFileIndex[sourceUri] ??
        (await indexSolidityFile(serverState, sourceUri));

      if (solFileEntry === undefined) {
        serverState.logger.error(
          new Error(
            `Could not send to validation process, uri is not indexed: ${sourceUri}`
          )
        );

        return { status: "failed_precondition", result: false };
      }

      addFrameworkTag(transaction, solFileEntry.project);

      // Get the file project's open documents
      const openDocuments = getOpenDocumentsInProject(
        serverState,
        solFileEntry.project
      ).map((openDoc) => ({
        uri: decodeUriAndRemoveFilePrefix(openDoc.uri),
        documentText: openDoc.getText(),
      }));

      // Ensure sourceUri is included in open documents
      if (!openDocuments.some((doc) => doc.uri === sourceUri)) {
        return { status: "failed_precondition", result: false };
      }

      // Associate validation request id to this file
      const validationId = ++serverState.validationCount;
      serverState.lastValidationId[sourceUri] = validationId;

      const { project } = solFileEntry;
      let validationResult: ValidationResult;

      const logger = _.clone(serverState.logger);
      logger.tag = `${path.basename(project.basePath)}:${validationId}`;

      try {
        let compilationDetails: CompilationDetails;
        let compilerOutput: any;

        // Get solc input from framework provider
        await logger.trackTime(
          `Building compilation (${project.frameworkName()} - ${path.basename(
            sourceUri
          )})`,
          async () => {
            compilationDetails = await project.buildCompilation(
              sourceUri,
              openDocuments
            );
          }
        );

        // Use bundled hardhat to compile
        await logger.trackTime("Compiling", async () => {
          compilerOutput = await CompilationService.compile(
            serverState,
            compilationDetails!
          );
        });

        validationResult = OutputConverter.getValidationResults(
          compilationDetails!,
          compilerOutput,
          project.basePath
        );
      } catch (error: any) {
        logger.trace(error?.message);
        logger.trace(error?.stack);

        if (error._isBuildInputError) {
          // Framework provider detailed error on why buildInput failed
          validationResult = {
            status: "BUILD_INPUT_ERROR",
            error,
          };
        } else if (error._isInitializationFailedError) {
          // Project could not be initialized correctly
          validationResult = {
            status: "INITIALIZATION_FAILED_ERROR",
            error,
          };
        } else {
          // Generic catch-all error
          validationResult = {
            status: "JOB_COMPLETION_ERROR",
            projectBasePath: project.basePath,
            reason: error?.message ?? error,
          };
        }
      }

      // Only show validation result if this is the latest validation request for this file
      if (serverState.lastValidationId[sourceUri] === validationId) {
        await sendResults(
          serverState,
          change,
          validationResult,
          openDocuments,
          project
        );
      }

      return {
        status: "ok",
        result: validationResult.status === "VALIDATION_PASS",
      };
    }
  );
}

async function sendResults(
  serverState: ServerState,
  change: TextDocumentChangeEvent<TextDocument>,
  validationResult: ValidationResult,
  openDocuments: OpenDocuments,
  project: Project
) {
  switch (validationResult.status) {
    case "JOB_COMPLETION_ERROR":
      return jobCompletionErrorFail(serverState, change, validationResult);
    case "VALIDATION_FAIL":
      return validationFail(serverState, change, validationResult);
    case "VALIDATION_PASS":
      return validationPass(
        serverState,
        change,
        validationResult,
        openDocuments
      );
    case "BUILD_INPUT_ERROR":
      return handleBuildInputError(
        serverState,
        change,
        validationResult,
        project
      );
    case "INITIALIZATION_FAILED_ERROR":
      return handleInitializationFailedError(
        serverState,
        validationResult,
        project
      );
    default:
      assertUnknownMessageStatus(validationResult);
      break;
  }
}

async function handleBuildInputError(
  serverState: ServerState,
  { document }: TextDocumentChangeEvent<TextDocument>,
  { error }: BuildInputFailed,
  project: Project
) {
  // Clear existing diagnostics
  await clearDiagnostics(serverState, document.uri);

  // Handle file-specific errors
  for (const [sourcePath, fileErrors] of Object.entries(
    error.fileSpecificErrors
  )) {
    const sourceUri = URI.file(sourcePath).toString();

    // Send diagnostics if the position is specified
    const diagnostics = fileErrors
      .filter((e) => e.startOffset !== undefined && e.endOffset !== undefined)
      .map(({ error: fileError, startOffset, endOffset }) => ({
        severity: DiagnosticSeverity.Error,
        source: fileError.source,
        code: fileError.code,
        message: fileError.message,
        range: offsetsToRange(document, startOffset!, endOffset!),
      }));

    await serverState.connection.sendDiagnostics({
      uri: sourceUri,
      diagnostics,
    });

    // Send status item error
    await sendStatusItemError(
      serverState,
      wildcardDriveLetter(project.basePath),
      fileErrors.map((e) => e.error.message).join(", "),
      sourceUri
    );
  }

  // Send status item for project-wide errors
  for (const projectWideError of error.projectWideErrors) {
    await sendStatusItemError(
      serverState,
      project.basePath,
      projectWideError.message
    );
  }
}

async function handleInitializationFailedError(
  serverState: ServerState,
  { error }: InitializationFailed,
  project: Project
) {
  // Send status item, project wide
  await sendStatusItemError(serverState, project.basePath, error.error);

  // Show a notification, only once per session, per project
  if (!serverState.shownInitializationError[project.id()]) {
    serverState.shownInitializationError[project.id()] = true;

    const message = `${project.frameworkName()} project '${path.basename(
      project.basePath
    )}' was not able to initialize correctly:\n ${error.error}`;

    return serverState.connection.sendNotification("window/showMessage", {
      type: MessageType.Error,
      message,
    });
  }
}

export async function clearDiagnostics(serverState: ServerState, uri: string) {
  return serverState.connection.sendDiagnostics({
    uri,
    diagnostics: [],
  });
}

function sendStatusItemError(
  serverState: ServerState,
  projectBasePath: string,
  message: string,
  errorFile?: string
) {
  const validationJobStatus: ValidationJobStatusNotification = {
    validationRun: false,
    projectBasePath,
    reason: message,
    displayText: message,
    errorFile,
  };

  return serverState.connection.sendNotification(
    "custom/validation-job-status",
    validationJobStatus
  );
}

async function jobCompletionErrorFail(
  serverState: ServerState,
  { document }: TextDocumentChangeEvent<TextDocument>,
  jobCompletionError: JobCompletionError
) {
  await clearDiagnostics(serverState, document.uri);

  const data: ValidationJobStatusNotification =
    jobStatusFrom(jobCompletionError);

  return serverState.connection.sendNotification(
    "custom/validation-job-status",
    data
  );
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

  return serverState.connection.sendNotification(
    "custom/validation-job-status",
    data
  );
}

function jobStatusFrom({
  projectBasePath,
  reason,
}: {
  projectBasePath: string;
  reason: string;
}): ValidationJobFailureNotification {
  switch (reason) {
    case "directly-imports-incompatible-file":
      return {
        validationRun: false,
        projectBasePath,
        reason,
        displayText: "directly imports incompatible file",
      };
    case "incompatible-overriden-solc-version":
      return {
        validationRun: false,
        projectBasePath,
        reason,
        displayText: "incompatible overriden solc version",
      };
    case "indirectly-imports-incompatible-file":
      return {
        validationRun: false,
        projectBasePath,
        reason,
        displayText: "indirectly imports incompatible file",
      };
    case "no-compatible-solc-version-found":
      return {
        validationRun: false,
        projectBasePath,
        reason,
        displayText: "no compatibile solc version found",
      };
    default:
      return {
        validationRun: false,
        projectBasePath,
        reason,
        displayText: reason,
      };
  }
}

async function validationPass(
  serverState: ServerState,
  _change: TextDocumentChangeEvent<TextDocument>,
  message: ValidationPass,
  openDocuments: OpenDocuments
): Promise<void> {
  for (const source of message.sources) {
    // TODO: improve this. Currently necessary because on hardhat source names are not full paths
    const docPath = openDocuments
      .map((doc) => doc.uri)
      .find((u) => toUnixStyle(u).endsWith(toUnixStyle(source)));

    if (docPath === undefined) {
      continue;
    }

    const uri = URI.file(docPath).toString();

    await clearDiagnostics(serverState, uri);
  }

  return sendValidationProcessSuccess(
    serverState,
    message.projectBasePath,
    message.version
  );
}

async function validationFail(
  serverState: ServerState,
  change: TextDocumentChangeEvent<TextDocument>,
  message: ValidationFail
): Promise<void> {
  const document = change.document;
  const diagnosticConverter = new DiagnosticConverter(serverState.logger);

  const diagnostics: { [uri: string]: Diagnostic[] } =
    diagnosticConverter.convertErrors(change.document, message.errors);

  const diagnosticsInOpenEditor = Object.entries(diagnostics)
    .filter(([diagSourceName]) =>
      decodeURIComponent(document.uri).includes(toUnixStyle(diagSourceName))
    )
    .flatMap(([, diagnostic]) => diagnostic);

  await serverState.connection.sendDiagnostics({
    uri: document.uri,
    diagnostics: diagnosticsInOpenEditor,
  });

  return sendValidationProcessSuccess(
    serverState,
    message.projectBasePath,
    message.version
  );
}

function assertUnknownMessageStatus(completeMessage: ValidationResult) {
  throw new Error(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    `Unrecognized message status: ${(completeMessage as any)?.status}`
  );
}

function offsetsToRange(
  document: TextDocument,
  startOffset: number,
  endOffset: number
): Range {
  return {
    start: document.positionAt(startOffset),
    end: document.positionAt(endOffset),
  };
}
