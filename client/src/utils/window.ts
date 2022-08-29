import { TextEditor } from "vscode";
import * as vscode from "vscode";
import { isHardhatInstalled } from "./hardhat";

export const openNewDocument = async (text: string): Promise<TextEditor> => {
  const document = await vscode.workspace.openTextDocument({
    language: "solidity",
  });
  const editor = await vscode.window.showTextDocument(document);
  await editor.edit((edit) => edit.insert(new vscode.Position(0, 0), text));
  return editor;
};

export const withProgressNotification = async (
  title: string,
  callback: () => Promise<unknown>
): Promise<unknown> => {
  return vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      cancellable: false,
      title,
    },
    callback
  );
};

export const ensureHardhatIsInstalled = async (
  hardhatDir: string
): Promise<boolean> => {
  if (!isHardhatInstalled(hardhatDir)) {
    await vscode.window.showErrorMessage(
      "Hardhat installation not found. Try installing the project's dependencies."
    );
    return false;
  }
  return true;
};
