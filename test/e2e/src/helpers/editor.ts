"use strict";
import * as vscode from "vscode";
import { join } from "path";
import * as fs from "fs";
import * as os from "os";
import assert from "assert";
import { sleep } from "./sleep";

export const CURSOR = "$$CURSOR$$";

/**
 * Create a temporary file with a given text and file extension
 * Provides a callback for manipulating the document
 */
export const withRandomFileEditor = async (
  text: string,
  fileExtension: string,
  run: (
    editor: vscode.TextEditor,
    document: vscode.TextDocument
  ) => Promise<void>
): Promise<void> => {
  const cursorIndex = text.indexOf(CURSOR);
  const file = await createRandomFile(text.replace(CURSOR, ""), fileExtension);
  const document = await vscode.workspace.openTextDocument(file);
  const editor = await vscode.window.showTextDocument(document);

  if (cursorIndex >= 0) {
    const position = document.positionAt(cursorIndex);
    editor.selection = new vscode.Selection(position, position);
  }

  await waitForUI();

  await run(editor, document);

  deleteFile(file);
  await vscode.commands.executeCommand("workbench.action.closeActiveEditor");
};

export const openFileInEditor = async (
  uri: vscode.Uri
): Promise<vscode.TextEditor> => {
  await vscode.commands.executeCommand("workbench.action.closeActiveEditor");
  const doc = await vscode.workspace.openTextDocument(uri);
  return vscode.window.showTextDocument(doc);
};

export const openQuickfixMenu = async () => {
  await waitForUI();
  await vscode.commands.executeCommand("editor.action.quickFix");
  await waitForUI();
};

export const applyQuickfix = async (index: number) => {
  for (let i = 0; i < index; i++) {
    await vscode.commands.executeCommand("focusNextCodeAction");
  }
  await vscode.commands.executeCommand("onEnterSelectCodeAction");
  await waitForUI();
};

export const goToPosition = (position: vscode.Position) => {
  getCurrentEditor().selection = new vscode.Selection(position, position);
};

export const compareWithFile = (
  editor: vscode.TextEditor,
  fileUri: vscode.Uri
) => {
  assert.equal(
    editor.document.getText(),
    fs.readFileSync(fileUri.fsPath).toString()
  );
};

const createRandomFile = async (
  contents: string,
  fileExtension: string
): Promise<vscode.Uri> => {
  const tmpFile = join(os.tmpdir(), `${Math.random()}.${fileExtension}`);
  fs.writeFileSync(tmpFile, contents);
  return vscode.Uri.file(tmpFile);
};

const deleteFile = (file: vscode.Uri): void => {
  fs.unlinkSync(file.fsPath);
};

// Some editor commands return immediately but the effect happens asynchronously
// This ensures the effect takes place before continuing execution
export const waitForUI = async () => {
  await sleep(500);
};

export const getCurrentEditor = () => {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return vscode.window.activeTextEditor!;
};
