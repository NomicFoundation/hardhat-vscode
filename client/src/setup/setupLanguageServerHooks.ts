import { workspace, TextDocument, env } from "vscode";
import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind,
} from "vscode-languageclient/node";
import { ExtensionState } from "../types";
import { getOuterMostWorkspaceFolder } from "../utils/getOuterMostWorkspaceFolder";
import { getUnsavedDocuments } from "../utils/getUnsavedDocuments";
import { showAnalyticsAllowPopup } from "../popups/showAnalyticsAllowPopup";
import { showFileIndexingProgress } from "../popups/showFileIndexingProgress";

export function setupLanguageServerHooks(extensionState: ExtensionState) {
  const didOpenTextDocument = buildDidOpenTextDocument(extensionState);

  workspace.onDidOpenTextDocument(didOpenTextDocument);
  workspace.textDocuments.forEach(didOpenTextDocument);
  workspace.onDidChangeWorkspaceFolders((event) => {
    const { clients } = extensionState;

    for (const folder of event.removed) {
      const client = clients.get(folder.uri.toString());

      if (client) {
        clients.delete(folder.uri.toString());
        client.stop();
      }
    }
  });
}

function buildDidOpenTextDocument(
  extensionState: ExtensionState
): (document: TextDocument) => void {
  const { logger } = extensionState;

  const didOpenTextDocument = (document: TextDocument): void => {
    // We are only interested in solidity files
    if (document.languageId !== "solidity" || document.uri.scheme !== "file") {
      return;
    }

    const uri = document.uri;
    let folder = workspace.getWorkspaceFolder(uri);

    // Files outside a folder can't be handled. This might depend on the language.
    // Single file languages like JSON might handle files outside the workspace folders.
    if (!folder) {
      return;
    }

    // If we have nested workspace folders we only start a server on the outer most workspace folder.
    folder = getOuterMostWorkspaceFolder(folder);

    if (!extensionState.clients.has(folder.uri.toString())) {
      // The debug options for the server.
      // --inspect=6009: runs the server in Node's Inspector mode so VS Code can attach to the server for debugging.
      const debugOptions = {
        execArgv: [
          "--nolazy",
          `--inspect=${6009 + extensionState.clients.size}`,
        ],
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
        workspaceFolder: folder,
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

      logger.info(`[LS: ${folder.name}] Client starting`);

      // Create the language client and start the client.
      // Start the client. This will also launch the server
      const client = new LanguageClient(
        "hardhat-language-server",
        "Hardhat Language Server",
        serverOptions,
        clientOptions
      );

      showAnalyticsAllowPopup(extensionState);

      client.onReady().then(() => {
        logger.info(`[LS: ${folder.name}] Client ready`);

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

      showFileIndexingProgress(client, folder.name);

      const telemetryChangeDisposable = env.onDidChangeTelemetryEnabled(
        (enabled: boolean) => {
          extensionState.globalTelemetryEnabled = enabled;

          client.sendNotification("custom/didChangeGlobalTelemetryEnabled", {
            enabled,
          });
        }
      );

      const hardhatTelemetryChangeDisposable =
        workspace.onDidChangeConfiguration((e) => {
          if (!e.affectsConfiguration("hardhat.telemetry")) {
            return;
          }

          extensionState.hardhatTelemetryEnabled = workspace
            .getConfiguration("hardhat")
            .get<boolean>("telemetry");

          client.sendNotification("custom/didChangeHardhatTelemetryEnabled", {
            enabled: extensionState.hardhatTelemetryEnabled,
          });
        });

      extensionState.listenerDisposables.push(telemetryChangeDisposable);
      extensionState.listenerDisposables.push(hardhatTelemetryChangeDisposable);

      client.start();
      extensionState.clients.set(folder.uri.toString(), client);
    }
  };

  return didOpenTextDocument;
}
