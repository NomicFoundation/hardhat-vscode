import * as path from "path";
import * as events from "events";
import {
  workspace,
  window,
  languages,
  ExtensionContext,
  TextDocument,
  OutputChannel,
  WorkspaceFolder,
  Uri,
  ProgressLocation,
  TextEdit,
  extensions,
} from "vscode";
import {
  LanguageClient,
  LanguageClientOptions,
  TransportKind,
} from "vscode-languageclient/node";

import { formatDocument } from "./formatter";
import { Logger } from "./Logger";

const CONFLICTING_EXTENSION_ID = "juanblanco.solidity";
const CONFLICTING_EXTENSION_NAME = "solidity";

type IndexFileData = {
  path: string;
  current: number;
  total: number;
};

const clients: Map<string, LanguageClient> = new Map();

let _sortedWorkspaceFolders: string[] | undefined;
function sortedWorkspaceFolders(): string[] {
  if (_sortedWorkspaceFolders === void 0) {
    _sortedWorkspaceFolders = workspace.workspaceFolders
      ? workspace.workspaceFolders
          .map((folder) => {
            let result = folder.uri.toString();

            if (result.charAt(result.length - 1) !== "/") {
              result = result + "/";
            }

            return result;
          })
          .sort((a, b) => {
            return a.length - b.length;
          })
      : [];
  }

  return _sortedWorkspaceFolders;
}

workspace.onDidChangeWorkspaceFolders(
  () => (_sortedWorkspaceFolders = undefined)
);

function getOuterMostWorkspaceFolder(folder: WorkspaceFolder): WorkspaceFolder {
  const sorted = sortedWorkspaceFolders();

  for (const element of sorted) {
    let uri = folder.uri.toString();

    if (uri.charAt(uri.length - 1) !== "/") {
      uri = uri + "/";
    }

    if (uri.startsWith(element)) {
      return workspace.getWorkspaceFolder(Uri.parse(element));
    }
  }

  return folder;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getUnsavedDocuments(): TextDocument[] {
  return workspace.textDocuments.filter((i) => i.isDirty);
}

/**
 * Sends a no-op change notification to the server, this allows the
 * triggering of validation.
 * @param client the language client
 * @param textDoc the open text file to trigger validation on
 */
function notifyOfNoopChange(client: LanguageClient, textDoc: TextDocument) {
  client.sendNotification("textDocument/didChange", {
    textDocument: {
      version: textDoc.version,
      uri: textDoc.uri.toString(),
    },
    contentChanges: [
      {
        range: {
          start: { line: 0, character: 0 },
          end: { line: 0, character: 0 },
        },
        rangeLength: 1,
        text: "",
      },
    ],
  });
}

/**
 * If the doc is open, trigger a noop change on the server to start validation.
 */
function triggerValidationForOpenDoc(client: LanguageClient, path: string) {
  const textDoc = workspace.textDocuments.find((d) => d.uri.path === path);

  if (!textDoc) {
    return;
  }

  notifyOfNoopChange(client, textDoc);
}

function showFileIndexingProgress(client: LanguageClient): void {
  const em = new events.EventEmitter();

  client.onReady().then(() => {
    client.onNotification("custom/indexing-file", (data: IndexFileData) => {
      em.emit("indexing-file", data);
    });
  });

  // Progress bar
  window.withProgress(
    {
      cancellable: true,
      location: ProgressLocation.Notification,
      title: "Indexing Project",
    },
    async (progress) => {
      progress.report({
        increment: 0,
        message: "Start indexing...",
      });

      const promise = new Promise<void>((resolve) => {
        em.on("indexing-file", (data: IndexFileData) => {
          progress.report({
            increment: Math.round(data.total / data.current),
            message: `Indexing ${data.path}`,
          });

          // Files that were open on vscode load, will
          // have swallowed the `didChange` event as the
          // language server wasn't intialized yet. We
          // revalidate open editor files after indexing
          // to ensure warning and errors appear on startup.
          triggerValidationForOpenDoc(client, data.path);

          if (data.total === data.current) {
            resolve();
          }
        });
      });

      await promise;

      progress.report({
        increment: 100,
        message: `Project indexing is complete.`,
      });

      await sleep(3000);
    }
  );
}

function showAnalyticsAllowPopup(client: LanguageClient): void {
  client.onReady().then(() => {
    client.onNotification("custom/analytics-allowed", async () => {
      const item = await window.showInformationMessage(
        "Help us improve Hardhat solidity extension with anonymous crash reports & basic usage data?",
        { modal: true },
        "Accept",
        "Decline"
      );

      const isAccepted = item === "Accept" ? true : false;
      client.sendNotification("custom/analytics-allowed", isAccepted);
    });
  });
}

async function warnOnOtherSolidityExtensions(logger: Logger) {
  const conflictingExtension = extensions.getExtension(
    CONFLICTING_EXTENSION_ID
  );

  if (conflictingExtension === undefined) {
    return;
  }

  try {
    await window.showWarningMessage(
      `Both this extension and the \`${CONFLICTING_EXTENSION_NAME}\` (${CONFLICTING_EXTENSION_ID}) extension are enabled. They have conflicting functionality. Disable one of them.`,
      "Okay"
    );
  } catch (err) {
    logger.error(err);
  }
}

export function activate(context: ExtensionContext) {
  const module = context.asAbsolutePath(path.join("server", "out", "index.js"));
  const outputChannel: OutputChannel = window.createOutputChannel(
    "solidity-language-server"
  );

  const logger = new Logger(outputChannel);

  logger.info("Hardhat VSCode Starting ...");

  warnOnOtherSolidityExtensions(logger);

  context.subscriptions.push(
    languages.registerDocumentFormattingEditProvider("ytidilos", {
      provideDocumentFormattingEdits(document: TextDocument): TextEdit[] {
        return formatDocument(document, context);
      },
    })
  );

  function didOpenTextDocument(document: TextDocument): void {
    // We are only interested in solidity files
    if (document.languageId !== "ytidilos" || document.uri.scheme !== "file") {
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

    if (!clients.has(folder.uri.toString())) {
      // The debug options for the server.
      // --inspect=6009: runs the server in Node's Inspector mode so VS Code can attach to the server for debugging.
      const debugOptions = {
        execArgv: ["--nolazy", `--inspect=${6009 + clients.size}`],
      };

      // If the extension is launched in debug mode then the debug server options are used.
      // Otherwise the run options are used.
      const serverOptions = {
        run: { module, transport: TransportKind.ipc },
        debug: { module, transport: TransportKind.ipc, options: debugOptions },
      };

      // Options to control the language client.
      const clientOptions: LanguageClientOptions = {
        // Register the server for solidity text documents.
        documentSelector: [
          { scheme: "file", language: "ytidilos", pattern: `**/*.sol` },
        ],
        diagnosticCollectionName: "solidity-language-server",
        workspaceFolder: folder,
        outputChannel: outputChannel,
      };

      logger.info(`[LS: ${folder.name}] Client starting`);

      // Create the language client and start the client.
      // Start the client. This will also launch the server
      const client = new LanguageClient(
        "solidity-language-server",
        "Solidity Language Server",
        serverOptions,
        clientOptions
      );

      showAnalyticsAllowPopup(client);

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

      showFileIndexingProgress(client);

      client.start();
      clients.set(folder.uri.toString(), client);
    }
  }

  workspace.onDidOpenTextDocument(didOpenTextDocument);
  workspace.textDocuments.forEach(didOpenTextDocument);
  workspace.onDidChangeWorkspaceFolders((event) => {
    for (const folder of event.removed) {
      const client = clients.get(folder.uri.toString());

      if (client) {
        clients.delete(folder.uri.toString());
        client.stop();
      }
    }
  });
}

export function deactivate(): Thenable<void> {
  const promises: Thenable<void>[] = [];

  for (const client of clients.values()) {
    promises.push(client.stop());
  }

  return Promise.all(promises).then(() => undefined);
}
