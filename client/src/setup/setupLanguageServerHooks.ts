import { workspace, env } from "vscode";
import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind,
} from "vscode-languageclient/node";
import { ExtensionState } from "../types";
import { isTelemetryEnabled } from "../utils/telemetry";
import { setupIndexingHooks } from "./setupIndexingHooks";
import { setupValidationJobHooks } from "./setupValidationJobHooks";

export async function setupLanguageServerHooks(extensionState: ExtensionState) {
  return startLanguageServer(extensionState);
}

const startLanguageServer = async (
  extensionState: ExtensionState
): Promise<void> => {
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
    synchronize: {
      fileEvents: [
        workspace.createFileSystemWatcher("**/hardhat.config.{ts,js}"),
        workspace.createFileSystemWatcher("**/{truffle-config,truffle}.js"),
        workspace.createFileSystemWatcher("**/foundry.toml"),
        workspace.createFileSystemWatcher("**/ape-config.yaml"),
        workspace.createFileSystemWatcher("**/remappings.txt"),
        workspace.createFileSystemWatcher("**/*.sol"),
      ],
    },
    diagnosticCollectionName: "solidity-language-server",
    outputChannel: extensionState.outputChannel,
    initializationOptions: {
      extensionName: extensionState.name,
      extensionVersion: extensionState.version,
      env: extensionState.env,
      telemetryEnabled: extensionState.telemetryEnabled,
      machineId: extensionState.machineId,
      extensionConfig: workspace.getConfiguration("solidity"),
    },
  };

  logger.info(`Client starting`);

  // Create the language client and start the client.
  // Start the client. This will also launch the server
  const client = new LanguageClient(
    "solidity-language-server",
    "Solidity Language Server",
    serverOptions,
    clientOptions
  );

  setupIndexingHooks(extensionState, client);

  await setupValidationJobHooks(extensionState, client)
    .then((disposable) => extensionState.listenerDisposables.push(disposable))
    .catch((err) => extensionState.logger.error(err));

  const notifyTelemetryChanged = () => {
    const telemetryEnabled = isTelemetryEnabled();

    extensionState.telemetryEnabled = telemetryEnabled;

    void client.sendNotification("custom/didChangeTelemetryEnabled", {
      enabled: telemetryEnabled,
    });
  };

  const globalTelemetryChangeDisposable = env.onDidChangeTelemetryEnabled(
    notifyTelemetryChanged
  );

  const configChangedDisposable = workspace.onDidChangeConfiguration(() => {
    notifyTelemetryChanged();

    void client.sendNotification(
      "custom/didChangeExtensionConfig",
      workspace.getConfiguration("solidity")
    );
  });

  extensionState.listenerDisposables.push(globalTelemetryChangeDisposable);
  extensionState.listenerDisposables.push(configChangedDisposable);

  await client.start();

  extensionState.client = client;
};
