import { Connection } from "vscode-languageserver";
import { TextDocuments } from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";
import { Logger } from "@utils/Logger";
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
import { RequestType } from "vscode-languageserver-protocol";
import path = require("path");
import { decodeUriAndRemoveFilePrefix, toUnixStyle } from "./utils";
import { CompilerProcessFactory, ServerState } from "./types";
import { Telemetry } from "./telemetry/types";
import { attachDocumentHooks } from "./services/documents/attachDocumentHooks";

export interface GetSolFileDetailsParams {
  uri: string;
}
export type GetSolFileDetailsResponse =
  | { found: false }
  | { found: true; hardhat: false }
  | {
      found: true;
      hardhat: true;
      configPath: string;
      configDisplayPath: string;
    };

const GetSolFileDetails = new RequestType<
  GetSolFileDetailsParams,
  GetSolFileDetailsResponse,
  void
>("solidity/getSolFileDetails");

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
    telemetry,
    logger
  );

  attachLanguageServerLifeCycleHooks(serverState, workspaceFileRetriever);
  attachLanguageServerCommandHooks(serverState);
  attachCustomHooks(serverState);
  attachDocumentHooks(serverState);

  return serverState;
}

function setupUninitializedServerState(
  connection: Connection,
  compProcessFactory: CompilerProcessFactory,
  telemetry: Telemetry,
  logger: Logger
) {
  const serverState: ServerState = {
    env: "production",
    hasWorkspaceFolderCapability: false,
    globalTelemetryEnabled: false,
    hardhatTelemetryEnabled: false,
    indexJobCount: 0,
    compProcessFactory,
    connection,
    workspaceFolders: [],
    projects: {},
    documents: new TextDocuments(TextDocument),
    solFileIndex: {},
    workerProcesses: {},

    telemetry,
    logger,
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

  serverState.connection.onRequest(
    GetSolFileDetails,
    (params: GetSolFileDetailsParams): GetSolFileDetailsResponse => {
      try {
        const solFil =
          serverState.solFileIndex[decodeUriAndRemoveFilePrefix(params.uri)];

        if (solFil === undefined) {
          return { found: false };
        }

        if (solFil.project.type !== "hardhat") {
          return { found: true, hardhat: false };
        }

        const displayConfigPath = toUnixStyle(
          path.relative(
            decodeUriAndRemoveFilePrefix(solFil.project.workspaceFolder.uri),
            solFil.project.configPath
          )
        );

        return {
          found: true,
          hardhat: true,
          configPath: solFil.project.configPath,
          configDisplayPath: displayConfigPath,
        };
      } catch (err) {
        serverState.logger.error(err);
        return { found: false };
      }
    }
  );
}
