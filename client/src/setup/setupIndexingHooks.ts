import {
  workspace,
  TextDocument,
  languages,
  LanguageStatusSeverity,
  LanguageStatusItem,
  Uri,
} from "vscode";
import { LanguageClient } from "vscode-languageclient/node";
import { ExtensionState, Project } from "../types";

const INDEXING_JOB_ID = "indexing";

export function setupIndexingHooks(
  extensionState: ExtensionState,
  client: LanguageClient
): void {
  client
    .onReady()
    .then(() => {
      const indexingStartDisposable = client.onNotification(
        "custom/indexing-start",
        () => {
          extensionState.indexingFinished = false;

          const indexingStatusItem = setupIndexingLanguageStatusItem();

          extensionState.currentIndexingJobs.push(indexingStatusItem);
        }
      );

      const indexingEndDisposable = client.onNotification(
        "custom/indexing-end",
        () => {
          extensionState.indexingFinished = true;

          const indexingStatusItem = extensionState.currentIndexingJobs.find(
            (statusItem) => statusItem.id === INDEXING_JOB_ID
          );

          indexingStatusItem?.dispose();

          triggerValidationForOpenDoc(client);
        }
      );

      const fileIndexedDisposable = client.onNotification(
        "custom/file-indexed",
        ({ uri, project }: { uri: string; project: Project }) => {
          // Show the project associated to a given contract file as a status item
          const statusItem = findOrCreateProjectStatusItem(extensionState, uri);

          statusItem.severity = LanguageStatusSeverity.Information;
          statusItem.text = `Project: ${project.frameworkName}`;
          if (project.configPath !== undefined) {
            statusItem.command = {
              title: "Open config file",
              command: "vscode.open",
              arguments: [Uri.file(project.configPath)],
            };
          }
        }
      );

      extensionState.listenerDisposables.push(indexingStartDisposable);
      extensionState.listenerDisposables.push(indexingEndDisposable);
      extensionState.listenerDisposables.push(fileIndexedDisposable);
    })
    .catch((reason) => extensionState.logger.error(reason));
}

function findOrCreateProjectStatusItem(
  extensionState: ExtensionState,
  uri: string
) {
  const foundStatusItem = extensionState.projectStatusItems.find(
    (item) => item.id === `project-${uri}`
  );

  if (foundStatusItem !== undefined) {
    return foundStatusItem;
  }

  const statusItem = languages.createLanguageStatusItem(`project-${uri}`, {
    language: "solidity",
    pattern: uri,
  });

  extensionState.projectStatusItems.push(statusItem);

  return statusItem;
}

function setupIndexingLanguageStatusItem(): LanguageStatusItem {
  const statusItem = languages.createLanguageStatusItem(INDEXING_JOB_ID, {
    language: "solidity",
  });

  statusItem.severity = LanguageStatusSeverity.Information;
  statusItem.name = `Indexing`;
  statusItem.text = `Scanning for sol files`;
  statusItem.detail = undefined;
  statusItem.busy = true;

  return statusItem;
}

/**
 * If the doc is open, trigger a noop change on the server to start validation.
 */
function triggerValidationForOpenDoc(client: LanguageClient) {
  workspace.textDocuments.forEach((doc) => {
    // Only trigger files that belong to the project whose worker is ready
    notifyOfNoopChange(client, doc);
  });
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
