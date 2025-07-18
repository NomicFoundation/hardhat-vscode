import {
  InitializeParams,
  TextDocumentSyncKind,
  InitializeResult,
  WorkspaceFolder,
} from "vscode-languageserver/node";
import { ServerState } from "../../types";
import { tokensTypes } from "../semanticHighlight/tokenTypes";
import { OK } from "../../telemetry/TelemetryStatus";
import { indexWorkspaceFolders } from "./indexWorkspaceFolders";
import { updateAvailableSolcVersions } from "./updateAvailableSolcVersions";

export const onInitialize = (serverState: ServerState) => {
  const { logger } = serverState;

  return async (params: InitializeParams) => {
    logger.trace("onInitialize");
    logger.info("Language server starting");

    const {
      machineId,
      extensionName,
      extensionVersion,
      workspaceFolders,
      clientName,
      clientVersion,
    } = getSessionInfo(params);

    updateServerStateFromParams(serverState, params);

    serverState.telemetry.init(
      machineId,
      extensionName,
      extensionVersion,
      serverState,
      clientName,
      clientVersion
    );

    logInitializationInfo(serverState, {
      machineId,
      extensionName,
      extensionVersion,
      clientName,
      clientVersion,
      workspaceFolders,
    });

    await updateAvailableSolcVersions(serverState);

    logger.info("Language server ready");

    // Index and analysis
    await serverState.telemetry.trackTiming("indexing", async () => {
      await indexWorkspaceFolders(
        serverState,
        serverState.workspaceFileRetriever,
        workspaceFolders
      );

      return { status: OK, result: null };
    });

    // Build and return InitializeResult
    const result: InitializeResult = {
      serverInfo: {
        name: "Solidity Language Server",
      },
      capabilities: {
        textDocumentSync: TextDocumentSyncKind.Incremental,
        // Tell the client that this server supports code completion.
        completionProvider: {
          triggerCharacters: [".", "/", '"', "'", "*"],
        },
        signatureHelpProvider: {
          triggerCharacters: ["(", ","],
        },
        definitionProvider: true,
        typeDefinitionProvider: true,
        referencesProvider: true,
        implementationProvider: true,
        renameProvider: true,
        codeActionProvider: true,
        hoverProvider: true,
        documentFormattingProvider: true,
        semanticTokensProvider: {
          legend: {
            tokenTypes: tokensTypes,
            tokenModifiers: [],
          },
          range: false,
          full: true,
        },
        documentSymbolProvider: true,
        workspace: {
          workspaceFolders: {
            supported: false,
            changeNotifications: false,
          },
        },
      },
    };

    if (serverState.hasWorkspaceFolderCapability) {
      result.capabilities.workspace = {
        workspaceFolders: {
          supported: true,
          changeNotifications: true,
        },
      };
    }

    return result;
  };
};

function getSessionInfo(params: InitializeParams) {
  const machineId: string | undefined = params.initializationOptions?.machineId;
  const extensionName: string | undefined =
    params.initializationOptions?.extensionName;
  const extensionVersion: string | undefined =
    params.initializationOptions?.extensionVersion;

  const workspaceFolders = params.workspaceFolders || [];

  const clientName: string | undefined = params.clientInfo?.name;
  const clientVersion: string | undefined = params.clientInfo?.version;

  return {
    machineId,
    extensionName,
    extensionVersion,
    workspaceFolders,
    clientName,
    clientVersion,
  };
}

function updateServerStateFromParams(
  serverState: ServerState,
  params: InitializeParams
) {
  serverState.env = params.initializationOptions?.env ?? "production";

  serverState.telemetryEnabled =
    params.initializationOptions?.telemetryEnabled ?? false;

  serverState.hasWorkspaceFolderCapability =
    params.capabilities.workspace !== undefined &&
    params.capabilities.workspace.workspaceFolders === true;

  serverState.extensionConfig =
    params.initializationOptions?.extensionConfig ?? {};
}

function logInitializationInfo(
  serverState: ServerState,
  {
    machineId,
    extensionName,
    extensionVersion,
    clientName,
    clientVersion,
    workspaceFolders,
  }: {
    machineId: string | undefined;
    extensionName: string | undefined;
    extensionVersion: string | undefined;
    clientName: string | undefined;
    clientVersion: string | undefined;
    workspaceFolders: WorkspaceFolder[];
  }
) {
  const { logger } = serverState;

  logger.info(`  Release: ${extensionName}@${extensionVersion}`);
  logger.info(`  Environment: ${serverState.env}`);

  if (clientName !== undefined) {
    logger.info(`  Client: ${clientName}`);
  }

  if (clientVersion !== undefined) {
    logger.info(`  Client Version: ${clientVersion}`);
  }

  logger.info(`  Telemetry Enabled: ${serverState.telemetryEnabled}`);

  if (machineId !== undefined) {
    logger.info(
      `  Telemetry Tracking Id: ${
        machineId.length > 10 ? `${machineId.substring(0, 10)}...` : machineId
      }`
    );
  }

  if (workspaceFolders.length === 0) {
    logger.info(`  Workspace Folders: none`);
  } else {
    logger.info(`  Workspace Folders:`);
    for (const folder of workspaceFolders) {
      logger.info(`    ${folder.name} (${folder.uri})`);
    }
  }
}
