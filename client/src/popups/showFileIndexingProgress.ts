import * as events from "events";
import {
  workspace,
  window,
  TextDocument,
  languages,
  LanguageStatusSeverity,
} from "vscode";
import { LanguageClient } from "vscode-languageclient/node";
import { updateHardhatProjectLanguageItem } from "../languageitems/hardhatProject";
import { ExtensionState } from "../types";

type IndexFileData = {
  path: string;
  current: number;
  total: number;
};

export function showFileIndexingProgress(
  extensionState: ExtensionState,
  client: LanguageClient
): void {
  const em = new events.EventEmitter();

  client.onReady().then(() => {
    client.onNotification("custom/indexing-file", (data: IndexFileData) => {
      em.emit("indexing-file", data);
    });
  });

  // Show the language status item
  displayLanguageStatusItem(extensionState, client, em);
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

async function displayLanguageStatusItem(
  extensionState: ExtensionState,
  client: LanguageClient,
  em: events
) {
  const statusItem = languages.createLanguageStatusItem("indexing", {
    language: "solidity",
  });

  statusItem.severity = LanguageStatusSeverity.Information;
  statusItem.name = `Indexing`;
  statusItem.text = `Scanning for sol files`;
  statusItem.detail = undefined;
  statusItem.busy = true;

  const promise = new Promise<void>((resolve) => {
    em.on("indexing-file", (data: IndexFileData) => {
      if (statusItem.detail === undefined) {
        statusItem.detail = `${data.total} files`;
      }

      // Files that were open on vscode load, will
      // have swallowed the `didChange` event as the
      // language server wasn't intialized yet. We
      // revalidate open editor files after indexing
      // to ensure warning and errors appear on startup.
      triggerValidationForOpenDoc(client, data.path);

      // check to display language status item
      if (window.activeTextEditor.document.uri.path === data.path) {
        updateHardhatProjectLanguageItem(
          extensionState,
          window.activeTextEditor.document
        );
      }

      if (data.total !== data.current) {
        return;
      }

      resolve();
    });
  });

  await promise;

  statusItem.busy = false;
  statusItem.dispose();
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
