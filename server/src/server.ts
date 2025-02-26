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
import { availableVersions } from "./services/initialization/updateAvailableSolcVersions";
import { onDocumentFormatting } from "./services/formatting/onDocumentFormatting";
import { onSemanticTokensFull } from "./services/semanticHighlight/onSemanticTokensFull";
import { onDocumentSymbol } from "./services/documentSymbol/onDocumentSymbol";
import { Analytics } from "./analytics/types";

export default function setupServer(
  connection: Connection,
  workspaceFileRetriever: WorkspaceFileRetriever,
  telemetry: Telemetry,
  analytics: Analytics,
  logger: Logger
): ServerState {
  const serverState = setupUninitializedServerState(
    connection,
    telemetry,
    analytics,
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
  analytics: Analytics,
  logger: Logger,
  workspaceFileRetriever: WorkspaceFileRetriever
) {
  const serverState: ServerState = {
    env: "production",
    hasWorkspaceFolderCapability: false,
    telemetryEnabled: false,
    connection,
    indexedWorkspaceFolders: [],
    projects: {},
    documents: new TextDocuments(TextDocument),
    solFileIndex: {},
    telemetry,
    analytics,
    logger,
    solcVersions: availableVersions,
    validationCount: 0,
    lastValidationId: {},
    workspaceFileRetriever,
    cachedCompilerInfo: {},
    shownInitializationError: {},
    extensionConfig: {},
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
  connection.onDocumentFormatting(onDocumentFormatting(serverState));
  connection.onDocumentSymbol(onDocumentSymbol(serverState));
  connection.languages.semanticTokens.on(onSemanticTokensFull(serverState));
}

function attachCustomHooks(serverState: ServerState) {
  const { connection, logger } = serverState;

  connection.onNotification(
    "custom/didChangeTelemetryEnabled",
    async ({ enabled }: { enabled: boolean }) => {
      if (enabled) {
        logger.info(`Telemetry enabled`);
      } else {
        logger.info(`Telemetry disabled`);
      }

      serverState.telemetryEnabled = enabled;
      await serverState.analytics.sendTelemetryChange(enabled);
    }
  );

  connection.onNotification(
    "custom/didChangeExtensionConfig",
    (extensionConfig) => {
      serverState.extensionConfig = extensionConfig;
    }
  );

  connection.onNotification("custom/telemetryConsent", async (payload) => {
    await serverState.analytics.sendTelemetryResponse(payload);
  });
}
