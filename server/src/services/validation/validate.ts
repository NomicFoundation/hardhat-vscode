/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Diagnostic,
  DiagnosticSeverity,
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
} from "../../types";
import { getOpenDocumentsInProject } from "../../queries/getOpenDocumentsInProject";
import { runningOnWindows } from "../../utils/operatingSystem";
import { CompilationDetails } from "../../frameworks/base/CompilationDetails";
import { DiagnosticConverter } from "./DiagnosticConverter";
import { CompilationService } from "./CompilationService";
import { OutputConverter } from "./OutputConverter";
export async function validate(
  serverState: ServerState,
  change: TextDocumentChangeEvent<TextDocument>
): Promise<boolean | null> {
  return serverState.telemetry.trackTiming("validation", async () => {
    // Ensure file is analyzed
    const sourceUri = decodeUriAndRemoveFilePrefix(change.document.uri);
    const solFileEntry = serverState.solFileIndex[sourceUri];

    if (solFileEntry === undefined) {
      serverState.logger.error(
        new Error(
          `Could not send to validation process, uri is not indexed: ${sourceUri}`
        )
      );

      return { status: "failed_precondition", result: false };
    }

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
      logger.trace(error);

      if (error._isBuildInputError) {
        // Framework provider detailed error on why buildInput failed
        validationResult = {
          status: "BUILD_INPUT_ERROR",
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
      sendResults(
        serverState,
        change,
        validationResult,
        openDocuments,
        project.basePath
      );
    }

    return {
      status: "ok",
      result: validationResult.status === "VALIDATION_PASS",
    };
  });
}

function sendResults(
  serverState: ServerState,
  change: TextDocumentChangeEvent<TextDocument>,
  validationResult: ValidationResult,
  openDocuments: OpenDocuments,
  projectBasePath: string
) {
  switch (validationResult.status) {
    case "JOB_COMPLETION_ERROR":
      jobCompletionErrorFail(serverState, change, validationResult);
      break;
    case "VALIDATION_FAIL":
      validationFail(serverState, change, validationResult);
      break;
    case "VALIDATION_PASS":
      validationPass(serverState, change, validationResult, openDocuments);
      break;
    case "BUILD_INPUT_ERROR":
      handleBuildInputError(
        serverState,
        change,
        validationResult,
        projectBasePath
      );
      break;
    default:
      assertUnknownMessageStatus(validationResult);
      break;
  }
}

function handleBuildInputError(
  serverState: ServerState,
  { document }: TextDocumentChangeEvent<TextDocument>,
  { error }: BuildInputFailed,
  projectBasePath: string
) {
  // Clear existing diagnostics
  clearDiagnostics(serverState, document.uri);

  // Handle file-specific errors
  for (const [sourceUri, fileErrors] of Object.entries(
    error.fileSpecificErrors
  )) {
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

    serverState.connection.sendDiagnostics({
      uri: URI.file(sourceUri).toString(),
      diagnostics,
    });

    // Send status item error
    sendStatusItemError(
      serverState,
      projectBasePath,
      fileErrors.map((e) => e.error.message).join(", "),
      sourceUri
    );
  }

  // Send status item for project-wide errors
  for (const projectWideError of error.projectWideErrors) {
    sendStatusItemError(serverState, projectBasePath, projectWideError.message);
  }
}

function clearDiagnostics(serverState: ServerState, uri: string) {
  serverState.connection.sendDiagnostics({
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

  serverState.connection.sendNotification(
    "custom/validation-job-status",
    validationJobStatus
  );
}

function jobCompletionErrorFail(
  serverState: ServerState,
  { document }: TextDocumentChangeEvent<TextDocument>,
  jobCompletionError: JobCompletionError
) {
  clearDiagnostics(serverState, document.uri);

  const data: ValidationJobStatusNotification =
    jobStatusFrom(jobCompletionError);

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

function validationPass(
  serverState: ServerState,
  _change: TextDocumentChangeEvent<TextDocument>,
  message: ValidationPass,
  openDocuments: OpenDocuments
): void {
  for (const source of message.sources) {
    // TODO: improve this. Currently necessary because on hardhat source names are not full paths
    let uri = openDocuments
      .map((doc) => doc.uri)
      .find((u) => toUnixStyle(u).endsWith(source));
    if (uri === undefined) {
      continue;
    }

    uri = runningOnWindows() ? `/${uri}` : uri;

    clearDiagnostics(serverState, uri);
  }

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

  const diagnosticsInOpenEditor = Object.entries(diagnostics)
    .filter(([diagnosticUri]) =>
      decodeURIComponent(document.uri).includes(diagnosticUri)
    )
    .flatMap(([, diagnostic]) => diagnostic);

  serverState.connection.sendDiagnostics({
    uri: document.uri,
    diagnostics: diagnosticsInOpenEditor,
  });

  sendValidationProcessSuccess(
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
