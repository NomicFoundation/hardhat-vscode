"use strict";
import * as vscode from "vscode";
import { join } from "path";
import * as fs from "fs";
import * as os from "os";
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

  await sleep(300); // Wait a bit, otherwise onEnterRules randomly don't work on test scenarios

  await run(editor, document);

  deleteFile(file);
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

export const openFileInEditor = async (uri: vscode.Uri) => {
  const doc = await vscode.workspace.openTextDocument(uri);
  await vscode.window.showTextDocument(doc);
};
