import { Connection } from "vscode-languageserver";
import { TextDocuments } from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";

import { LanguageService } from "./parser";
import { Logger } from "@utils/Logger";
import { Telemetry } from "./telemetry/types";
import { ServerState } from "./types";
import { WorkspaceFileRetriever } from "@analyzer/WorkspaceFileRetriever";
import { onHover } from "@services/hover/onHover";
import { onInitialize } from "@services/initialization/onInitialize";
import { onInitialized } from "@services/initialization/onInitialized";
import { onSignatureHelp } from "@services/signaturehelp/onSignatureHelp";
import { onCompletion } from "@services/completion/onCompletion";
import { onCodeAction } from "@services/codeactions/onCodeAction";
import { compilerProcessFactory } from "@services/validation/compilerProcessFactory";
import { onDefinition } from "@services/definition/onDefinition";
import { onTypeDefinition } from "@services/typeDefinition/onTypeDefinition";
import { onReferences } from "@services/references/onReferences";
import { onImplementation } from "@services/implementation/onImplementation";
import { onRename } from "@services/rename/onRename";
import { onDidChangeContent } from "@services/validation/onDidChangeContent";

export default function setupServer(
  connection: Connection,
  compProcessFactory: typeof compilerProcessFactory,
  workspaceFileRetriever: WorkspaceFileRetriever,
  telemetry: Telemetry,
  logger: Logger
): ServerState {
  const serverState = setupUninitializedServerState(
    connection,
    compProcessFactory,
    workspaceFileRetriever,
    telemetry,
    logger
  );

  attachLanguageServerLifeCycleHooks(serverState);
  attachLanguageServerCommandHooks(serverState);
  attachCustomNotifiactionHooks(serverState);

  listenForDocumentChanges(serverState);

  return serverState;
}

function setupUninitializedServerState(
  connection: Connection,
  compProcessFactory: typeof compilerProcessFactory,
  workspaceFileRetriever: WorkspaceFileRetriever,
  telemetry: Telemetry,
  logger: Logger
) {
  const serverState: ServerState = {
    env: "production",
    hasWorkspaceFolderCapability: false,
    globalTelemetryEnabled: false,
    hardhatTelemetryEnabled: false,
    connection,
    workspaceFolders: [],
    documents: new TextDocuments(TextDocument),
    languageServer: new LanguageService(
      compProcessFactory,
      workspaceFileRetriever,
      connection,
      logger
    ),
    telemetry,
    logger,
  };

  return serverState;
}

function attachLanguageServerLifeCycleHooks(serverState: ServerState) {
  const { connection } = serverState;

  connection.onInitialize(onInitialize(serverState));
  connection.onInitialized(onInitialized(serverState));

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

function attachCustomNotifiactionHooks(serverState: ServerState) {
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

function listenForDocumentChanges(serverState: ServerState) {
  // The content of a text document has changed. This event is emitted
  // when the text document first opened or when its content has changed.
  // This is the start of our validation pipeline
  serverState.documents.onDidChangeContent(onDidChangeContent(serverState));

  // Make the text document manager listen on the connection
  // for open, change and close text document events
  serverState.documents.listen(serverState.connection);
}
