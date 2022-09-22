/* eslint-disable @typescript-eslint/no-explicit-any */
import { Diagnostic, TextDocumentChangeEvent } from "vscode-languageserver";
import { TextDocument } from "vscode-languageserver-textdocument";
import { isHardhatProject } from "@analyzer/HardhatProject";
import { deserializeError } from "serialize-error";
import path from "path";
import { decodeUriAndRemoveFilePrefix } from "../../utils/index";
import {
  CancelledValidation,
  HardhatError,
  HardhatSourceImportError,
  HardhatThrownError,
  JobCompletionError,
  ServerState,
  UnknownError,
  ValidationCompleteMessage,
  ValidationFail,
  ValidationJobFailureNotification,
  ValidationJobStatusNotification,
  ValidationPass,
  ValidatorError,
} from "../../types";
import { getOpenDocumentsInProject } from "../../queries/getOpenDocumentsInProject";
import { runningOnWindows } from "../../utils/operatingSystem";
import Project from "../../projects/base/Project";
import { DiagnosticConverter } from "./DiagnosticConverter";
import { convertHardhatErrorToDiagnostic } from "./convertHardhatErrorToDiagnostic";
import CompilationService from "./CompilationService";
import OutputConverter from "./OutputConverter";

export async function validate(
  serverState: ServerState,
  change: TextDocumentChangeEvent<TextDocument>
): Promise<boolean | null> {
  return serverState.telemetry.trackTiming("validation", async () => {
    if (!serverState.indexingFinished) {
      serverState.logger.trace(`Can't validate before indexing is finished`);
      return { status: "failed_precondition", result: false };
    }

    const internalUri = decodeUriAndRemoveFilePrefix(change.document.uri);

    const solFileEntry = serverState.solFileIndex[internalUri];

    if (solFileEntry === undefined) {
      serverState.logger.error(
        new Error(
          `Could not send to valiation process, uri is not indexed: ${internalUri}`
        )
      );

      return { status: "failed_precondition", result: false };
    }

    const openDocuments = getOpenDocumentsInProject(
      serverState,
      solFileEntry.project
    ).map((openDoc) => ({
      uri: decodeUriAndRemoveFilePrefix(openDoc.uri),
      documentText: openDoc.getText(),
    }));

    const documentText = change.document.getText();

    let validationResult: ValidationCompleteMessage;

    const { project } = solFileEntry;

    if (isHardhatProject(project)) {
      const workerProcess =
        serverState.workerProcesses[solFileEntry.project.basePath];

      if (workerProcess === undefined) {
        serverState.logger.error(
          new Error(
            `No worker process for project: ${solFileEntry.project.basePath}`
          )
        );

        return { status: "failed_precondition", result: false };
      }

      validationResult = await workerProcess.validate({
        uri: internalUri,
        documentText,
        projectBasePath: solFileEntry.project.basePath,
        openDocuments,
      });
    } else if (project instanceof Project) {
      try {
        const compilationDetails = await project.builder.buildCompilation(
          internalUri,
          openDocuments
        );
        const compilerOutput = await CompilationService.compile(
          compilationDetails
        );

        validationResult = OutputConverter.getValidationResults(
          compilationDetails,
          compilerOutput,
          project.basePath
        );
      } catch (error: any) {
        serverState.logger.error(`Error building compilation: ${error}`);
        validationResult = {
          type: "VALIDATION_COMPLETE",
          status: "JOB_COMPLETION_ERROR",
          jobId: 1,
          projectBasePath: project.basePath,
          reason: error.message,
        };
      }
    } else {
      throw new Error("No project associated with sol file");
    }

    sendResults(serverState, change, validationResult);

    return {
      status: "ok",
      result: validationResult.status === "VALIDATION_PASS",
    };
  });
}

function sendResults(
  serverState: ServerState,
  change: TextDocumentChangeEvent<TextDocument>,
  completeMessage: ValidationCompleteMessage
) {
  switch (completeMessage.status) {
    case "HARDHAT_ERROR":
      hardhatThrownFail(serverState, change, completeMessage);
      break;
    case "JOB_COMPLETION_ERROR":
      jobCompletionErrorFail(serverState, change, completeMessage);
      break;
    case "VALIDATOR_ERROR":
      validatorErrorFail(serverState, change, completeMessage);
      break;
    case "UNKNOWN_ERROR":
      unknownErrorFail(serverState, change, completeMessage);
      break;
    case "VALIDATION_FAIL":
      validationFail(serverState, change, completeMessage);
      break;
    case "VALIDATION_PASS":
      validationPass(serverState, change, completeMessage);
      break;
    case "CANCELLED":
      cancelled(serverState, change, completeMessage);
      break;
    default:
      assertUnknownMessageStatus(completeMessage);
      break;
  }
}

function hardhatThrownFail(
  serverState: ServerState,
  { document }: TextDocumentChangeEvent<TextDocument>,
  { projectBasePath, hardhatError }: HardhatThrownError
) {
  const diagnostic = convertHardhatErrorToDiagnostic(document, hardhatError);

  if (diagnostic === null) {
    // note the error
    serverState.logger.error(hardhatError);

    // clear any diagnostics on the page
    serverState.connection.sendDiagnostics({
      uri: document.uri,
      diagnostics: [],
    });

    const displayText = hardhatError.errorDescriptor.title;

    const errorFile = isHardhatSourceImportError(hardhatError)
      ? resolveErrorFilePath(projectBasePath, hardhatError)
      : undefined;

    const validationJobStatus: ValidationJobStatusNotification = {
      validationRun: false,
      projectBasePath,
      reason: "non-import line hardhat error",
      displayText,
      errorFile,
    };

    serverState.connection.sendNotification(
      "custom/validation-job-status",
      validationJobStatus
    );
  } else {
    serverState.connection.sendDiagnostics({
      uri: document.uri,
      diagnostics: [diagnostic],
    });

    const validationJobStatus: ValidationJobStatusNotification = {
      validationRun: false,
      projectBasePath,
      reason: "import line hardhat error",
      displayText: "import error",
    };

    serverState.connection.sendNotification(
      "custom/validation-job-status",
      validationJobStatus
    );
  }
}

function jobCompletionErrorFail(
  serverState: ServerState,
  { document }: TextDocumentChangeEvent<TextDocument>,
  jobCompletionError: JobCompletionError
) {
  serverState.connection.sendDiagnostics({
    uri: document.uri,
    diagnostics: [],
  });

  const data: ValidationJobStatusNotification =
    jobStatusFrom(jobCompletionError);

  serverState.connection.sendNotification("custom/validation-job-status", data);
}

function validatorErrorFail(
  serverState: ServerState,
  { document }: TextDocumentChangeEvent<TextDocument>,
  validatorError: ValidatorError
) {
  serverState.connection.sendDiagnostics({
    uri: document.uri,
    diagnostics: [],
  });
  const data: ValidationJobStatusNotification = jobStatusFrom(validatorError);

  serverState.connection.sendNotification("custom/validation-job-status", data);
}

function unknownErrorFail(
  serverState: ServerState,
  { document }: TextDocumentChangeEvent<TextDocument>,
  { error, projectBasePath }: UnknownError
) {
  // clear any current diagnostics
  serverState.connection.sendDiagnostics({
    uri: document.uri,
    diagnostics: [],
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const displayText = (error as any)?.message ?? "internal error";

  serverState.logger.error(deserializeError(error));

  const data: ValidationJobStatusNotification = {
    validationRun: false,
    projectBasePath,
    reason: "unknown",
    displayText,
  };

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
    case "validator-starting":
      return {
        validationRun: false,
        projectBasePath,
        reason,
        displayText: "validator starting",
      };
    case "validator-initialization-failed":
      return {
        validationRun: false,
        projectBasePath,
        reason,
        displayText: "unable to load hardhat config",
      };
    case "validator-in-unexpected-state":
      return {
        validationRun: false,
        projectBasePath,
        reason,
        displayText: "validator in unexpected state",
      };
    case "contract-not-in-project":
      return {
        validationRun: false,
        projectBasePath,
        reason,
        displayText: "not part of hardhat project",
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
  message: ValidationPass
): void {
  for (const source of message.sources) {
    const uri = runningOnWindows() ? `/${source}` : source;

    serverState.connection.sendDiagnostics({
      uri,
      diagnostics: [],
    });
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

function cancelled(
  serverState: ServerState,
  _change: TextDocumentChangeEvent<TextDocument>,
  message: CancelledValidation
): void {
  serverState.logger.trace(`Cancelled validation job ${message.jobId}`);
}

function assertUnknownMessageStatus(completeMessage: never) {
  throw new Error(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    `Unrecognized message status: ${(completeMessage as any)?.status}`
  );
}

function isHardhatSourceImportError(
  error: HardhatError
): error is HardhatSourceImportError {
  return (
    error.errorDescriptor.number >= 400 && error.errorDescriptor.number <= 499
  );
}

function resolveErrorFilePath(
  projectBasePath: string,
  hardhatError: HardhatSourceImportError
): string {
  const errorPath = decodeUriAndRemoveFilePrefix(
    path.join(projectBasePath, hardhatError.messageArguments.from)
  );

  const osPath = runningOnWindows() ? `/${errorPath}` : errorPath;

  return osPath;
}
