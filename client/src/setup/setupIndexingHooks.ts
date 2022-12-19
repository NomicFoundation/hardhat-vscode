import {
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
  // Show spinner when starting initialization
  const indexingStatusItem = setupIndexingLanguageStatusItem();

  client
    .onReady()
    .then(() => {
      // Hide spinner when initialization ends
      indexingStatusItem.dispose();

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
