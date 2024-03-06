import fs from "node:fs";
import path from "node:path";
import os from "node:os";

import { workspace, env } from "vscode";
import {
  CloseAction,
  ErrorAction,
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind,
} from "vscode-languageclient/node";
import { ExtensionState } from "../types";
import { isTelemetryEnabled } from "../utils/telemetry";
import { setupIndexingHooks } from "./setupIndexingHooks";
import { setupValidationJobHooks } from "./setupValidationJobHooks";

export function setupLanguageServerHooks(extensionState: ExtensionState) {
  startLanguageServer(extensionState);
}

const startLanguageServer = (extensionState: ExtensionState): void => {
  const { logger } = extensionState;

  // Catch our native crashes and report them to Sentry
  let reportFatalErrorsArgs = [];
  // eslint-disable-next-line no-constant-condition -- WIP: Change to isTelemetryEnabled()
  if (true) {
    const dirPath = fs.mkdtempSync(
      path.join(os.tmpdir(), "solidity-language-server-reports-")
    );
    const filename = "crash-report.txt";
    extensionState.crashReportFile = path.join(dirPath, filename);

    logger.info(
      `Fatal Node.js error reports will be written to ${extensionState.crashReportFile}`
    );

    reportFatalErrorsArgs = [
      "--report-on-fatalerror",
      "--report-uncaught-exception",
      `--report-directory=${dirPath}`,
      "--report-filename=crash-report.txt",
    ];
  }

  // The debug options for the server.
  // --inspect=6009: runs the server in Node's Inspector mode so VS Code can attach to the server for debugging.
  const debugOptions = {
    execArgv: ["--nolazy", `--inspect=${6009}`, ...reportFatalErrorsArgs],
  };

  // If the extension is launched in debug mode then the debug server options are used.
  // Otherwise the run options are used.
  const serverOptions: ServerOptions = {
    run: {
      module: extensionState.serverModulePath,
      transport: TransportKind.ipc,
      options: {
        execArgv: [...reportFatalErrorsArgs],
      },
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
    errorHandler: {
      error: () => ErrorAction.Continue,
      closed: () => {
        if (extensionState.crashReportFile !== null) {
          // TODO: Upgrade to newest vscode-languageserver-node to use the
          // async version of `ErrorHandler.closed`
          const dump = fs.readFileSync(extensionState.crashReportFile, "utf8");
          logger.error(dump);
          // fs.unlinkSync(extensionState.crashReportFile);
          // WIP: Use the Sentry API
          // extensionState.telemetry.captureException
        }

        return CloseAction.Restart;
      },
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

  setupValidationJobHooks(extensionState, client)
    .then((disposable) => extensionState.listenerDisposables.push(disposable))
    .catch((err) => extensionState.logger.error(err));

  const notifyTelemetryChanged = () => {
    const telemetryEnabled = isTelemetryEnabled();

    extensionState.telemetryEnabled = telemetryEnabled;
    client.sendNotification("custom/didChangeTelemetryEnabled", {
      enabled: telemetryEnabled,
    });
  };

  const globalTelemetryChangeDisposable = env.onDidChangeTelemetryEnabled(
    notifyTelemetryChanged
  );

  const configChangedDisposable = workspace.onDidChangeConfiguration(() => {
    notifyTelemetryChanged();
    client.sendNotification(
      "custom/didChangeExtensionConfig",
      workspace.getConfiguration("solidity")
    );
  });

  extensionState.listenerDisposables.push(globalTelemetryChangeDisposable);
  extensionState.listenerDisposables.push(configChangedDisposable);

  client.start();

  extensionState.client = client;
};
