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
) => {
  return vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      cancellable: false,
      title,
    },
    async () => {
      await callback();
    }
  );
};

export const ensureHardhatIsInstalled = async (
  hardhatDir: string
): Promise<boolean> => {
  if (!isHardhatInstalled(hardhatDir)) {
    await vscode.window.showInformationMessage(
      "Hardhat installation not found. Please install your packages."
    );
    return false;
  }
  return true;
};
