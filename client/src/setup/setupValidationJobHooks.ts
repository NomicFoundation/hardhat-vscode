import {
  LanguageStatusItem,
  languages,
  LanguageStatusSeverity,
  window,
} from "vscode";
import { LanguageClient } from "vscode-languageclient/node";
import { ExtensionState } from "../types";

export interface ValidationJobSuccessNotification {
  validationRun: true;
  version: string;
  projectBasePath: string;
}

export interface ValidationJobFailureNotification {
  validationRun: false;
  reason: string;
  displayText: string;
  projectBasePath: string;
  errorFile?: string;
}

export type ValidationJobStatusNotification =
  | ValidationJobFailureNotification
  | ValidationJobSuccessNotification;

export function setupValidationJobHooks(
  extensionState: ExtensionState,
  client: LanguageClient
) {
  return client.onReady().then(() => {
    // Trigger validation on newly focused documents
    window.onDidChangeActiveTextEditor((e) => {
      const uri = e?.document.uri.toString();
      const version = e?.document.version;

      if (uri !== undefined && version !== undefined && uri.endsWith(".sol")) {
        client.sendNotification("textDocument/didChange", {
          textDocument: { uri, version },
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
    });

    return client.onNotification(
      "custom/validation-job-status",
      (notification: ValidationJobStatusNotification) => {
        updateValidationStatusItem(extensionState, notification);
      }
    );
  });
}

function updateValidationStatusItem(
  extensionState: ExtensionState,
  notification: ValidationJobStatusNotification
): LanguageStatusItem {
  let statusItem;
  if (notification.projectBasePath in extensionState.projectsValidationStatus) {
    statusItem =
      extensionState.projectsValidationStatus[notification.projectBasePath];
  } else {
    statusItem = languages.createLanguageStatusItem(
      `validation:${notification.projectBasePath}`,
      {
        language: "solidity",
        pattern: `${notification.projectBasePath}/**/*.sol`,
      }
    );

    extensionState.projectsValidationStatus[notification.projectBasePath] =
      statusItem;
  }

  statusItem.severity = notification.validationRun
    ? LanguageStatusSeverity.Information
    : LanguageStatusSeverity.Error;
  statusItem.name = `Validation`;
  statusItem.text = notification.validationRun
    ? notification.version
    : "Validation blocked";
  statusItem.detail = notification.validationRun
    ? "Solc Version"
    : notification.displayText;
  statusItem.busy = false;

  if (!notification.validationRun && notification.errorFile !== undefined) {
    statusItem.command = {
      title: "Open file",
      command: "vscode.open",
      arguments: [notification.errorFile],
    };
  } else {
    statusItem.command = undefined;
  }

  return statusItem;
}
