import * as vscode from "vscode";

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
  const onChange = onDocumentChange(document);
  await vscode.commands.executeCommand("type", { text });
  await onChange;
  return document;
};
