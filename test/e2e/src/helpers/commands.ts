import * as vscode from "vscode";
import { sleep } from "./sleep";

const onDocumentChange = (
  doc: vscode.TextDocument
): Promise<vscode.TextDocument> => {
  return new Promise<vscode.TextDocument>((resolve) => {
    const disposable = vscode.workspace.onDidChangeTextDocument((e) => {
      if (e.document !== doc) {
        return;
      }
      disposable.dispose();
      resolve(e.document);
    });
  });
};

/**
 * Simulate typing on the editor
 */
export const type = async (
  document: vscode.TextDocument,
  text: string
): Promise<vscode.TextDocument> => {
  for (const char of text.split("")) {
    await sleep(100);
    const onChange = onDocumentChange(document);
    await vscode.commands.executeCommand("type", { text: char });
    await onChange;
  }
  return document;
};
