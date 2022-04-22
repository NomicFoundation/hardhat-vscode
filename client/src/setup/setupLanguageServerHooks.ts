import { workspace, env, window } from "vscode";
import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind,
} from "vscode-languageclient/node";
import { ExtensionState } from "../types";
import { getUnsavedDocuments } from "../utils/getUnsavedDocuments";
import { showFileIndexingProgress } from "../popups/showFileIndexingProgress";
import { onDidChangeActiveTextEditor } from "./onDidChangeActiveTextEditor";

export function setupLanguageServerHooks(extensionState: ExtensionState) {
  startLanguageServer(extensionState);
}

const startLanguageServer = (extensionState: ExtensionState): void => {
  const { logger } = extensionState;

  // The debug options for the server.
  // --inspect=6009: runs the server in Node's Inspector mode so VS Code can attach to the server for debugging.
  const debugOptions = {
    execArgv: ["--nolazy", `--inspect=${6009}`],
  };

  // If the extension is launched in debug mode then the debug server options are used.
  // Otherwise the run options are used.
  const serverOptions: ServerOptions = {
    run: {
      module: extensionState.serverModulePath,
      transport: TransportKind.ipc,
    },
    debug: {
      module: extensionState.serverModulePath,
      transport: TransportKind.ipc,
      options: debugOptions,
    },
  };

  // Options to control the language client.
  const clientOptions: LanguageClientOptions = {
    // Register the server for solidity text documents.
    documentSelector: [
      { scheme: "file", language: "solidity", pattern: `**/*.sol` },
    ],
    diagnosticCollectionName: "hardhat-language-server",
    outputChannel: extensionState.outputChannel,
    initializationOptions: {
      extensionName: extensionState.name,
      extensionVersion: extensionState.version,
      env: extensionState.env,
      globalTelemetryEnabled: extensionState.globalTelemetryEnabled,
      hardhatTelemetryEnabled: extensionState.hardhatTelemetryEnabled,
      machineId: extensionState.machineId,
    },
  };

  logger.info(`Client starting`);

  // Create the language client and start the client.
  // Start the client. This will also launch the server
  const client = new LanguageClient(
    "hardhat-language-server",
    "Hardhat Language Server",
    serverOptions,
    clientOptions
  );

  client.onReady().then(() => {
    logger.info(`Client ready`);

    client.onNotification("custom/get-unsaved-documents", () => {
      const unsavedDocuments = getUnsavedDocuments();

      client.sendNotification(
        "custom/get-unsaved-documents",
        unsavedDocuments.map((unsavedDocument) => {
          return {
            uri: unsavedDocument.uri,
            languageId: unsavedDocument.languageId,
            version: unsavedDocument.version,
            content: unsavedDocument.getText(),
          };
        })
      );
    });
  });

  showFileIndexingProgress(extensionState, client);

  const telemetryChangeDisposable = env.onDidChangeTelemetryEnabled(
    (enabled: boolean) => {
      extensionState.globalTelemetryEnabled = enabled;

      client.sendNotification("custom/didChangeGlobalTelemetryEnabled", {
        enabled,
      });
    }
  );

  const hardhatTelemetryChangeDisposable = workspace.onDidChangeConfiguration(
    (e) => {
      if (!e.affectsConfiguration("hardhat.telemetry")) {
        return;
      }

      extensionState.hardhatTelemetryEnabled = workspace
        .getConfiguration("hardhat")
        .get<boolean>("telemetry");

      client.sendNotification("custom/didChangeHardhatTelemetryEnabled", {
        enabled: extensionState.hardhatTelemetryEnabled,
      });
    }
  );

  extensionState.listenerDisposables.push(telemetryChangeDisposable);
  extensionState.listenerDisposables.push(hardhatTelemetryChangeDisposable);

  window.onDidChangeActiveTextEditor(
    onDidChangeActiveTextEditor(extensionState)
  );

  client.start();

  extensionState.client = client;
};
