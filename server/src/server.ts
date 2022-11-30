import { Connection } from "vscode-languageserver";
import { TextDocuments } from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";
import { Logger } from "@utils/Logger";
import { WorkspaceFileRetriever } from "@utils/WorkspaceFileRetriever";
import { onHover } from "@services/hover/onHover";
import { onInitialize } from "@services/initialization/onInitialize";
import { onInitialized } from "@services/initialization/onInitialized";
import { onSignatureHelp } from "@services/signaturehelp/onSignatureHelp";
import { onCompletion } from "@services/completion/onCompletion";
import { onCodeAction } from "@services/codeactions/onCodeAction";
import { onDefinition } from "@services/definition/onDefinition";
import { onTypeDefinition } from "@services/typeDefinition/onTypeDefinition";
import { onReferences } from "@services/references/onReferences";
import { onImplementation } from "@services/implementation/onImplementation";
import { onRename } from "@services/rename/onRename";
import { ServerState } from "./types";
import { Telemetry } from "./telemetry/types";
import { attachDocumentHooks } from "./services/documents/attachDocumentHooks";

export default function setupServer(
  connection: Connection,
  workspaceFileRetriever: WorkspaceFileRetriever,
  telemetry: Telemetry,
  logger: Logger
): ServerState {
  const serverState = setupUninitializedServerState(
    connection,
    telemetry,
    logger,
    workspaceFileRetriever
  );

  attachLanguageServerLifeCycleHooks(serverState, workspaceFileRetriever);
  attachLanguageServerCommandHooks(serverState);
  attachCustomHooks(serverState);
  attachDocumentHooks(serverState);

  return serverState;
}

function setupUninitializedServerState(
  connection: Connection,
  telemetry: Telemetry,
  logger: Logger,
  workspaceFileRetriever: WorkspaceFileRetriever
) {
  const serverState: ServerState = {
    env: "production",
    hasWorkspaceFolderCapability: false,
    globalTelemetryEnabled: false,
    hardhatTelemetryEnabled: false,
    connection,
    indexedWorkspaceFolders: [],
    projects: {},
    documents: new TextDocuments(TextDocument),
    solFileIndex: {},
    telemetry,
    logger,
    solcVersions: [],
    validationCount: 0,
    lastValidationId: {},
    workspaceFileRetriever,
    cachedCompilerInfo: {},
  };

  return serverState;
}

function attachLanguageServerLifeCycleHooks(
  serverState: ServerState,
  workspaceFileRetriever: WorkspaceFileRetriever
) {
  const { connection } = serverState;

  connection.onInitialize(onInitialize(serverState));
  connection.onInitialized(onInitialized(serverState, workspaceFileRetriever));

  connection.onExit(() => {
    serverState.logger.info("Server closing down");
    return serverState.telemetry.close();
  });
}

function attachLanguageServerCommandHooks(serverState: ServerState) {
  const { connection } = serverState;

  connection.onSignatureHelp(onSignatureHelp(serverState));
  connection.onCompletion(onCompletion(serverState));
  connection.onDefinition(onDefinition(serverState));
  connection.onTypeDefinition(onTypeDefinition(serverState));
  connection.onReferences(onReferences(serverState));
  connection.onImplementation(onImplementation(serverState));
  connection.onRenameRequest(onRename(serverState));
  connection.onCodeAction(onCodeAction(serverState));
  connection.onHover(onHover(serverState));
}

function attachCustomHooks(serverState: ServerState) {
  const { connection, logger } = serverState;

  connection.onNotification(
    "custom/didChangeGlobalTelemetryEnabled",
    ({ enabled }: { enabled: boolean }) => {
      if (enabled) {
        logger.info(`Global telemetry enabled`);
      } else {
        logger.info(`Global telemetry disabled`);
      }

      serverState.globalTelemetryEnabled = enabled;
    }
  );

  connection.onNotification(
    "custom/didChangeHardhatTelemetryEnabled",
    ({ enabled }: { enabled: boolean }) => {
      if (enabled) {
        logger.info(`Hardhat telemetry enabled`);
      } else {
        logger.info(`Hardhat telemetry disabled`);
      }

      serverState.hardhatTelemetryEnabled = enabled;
    }
  );
}
