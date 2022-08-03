"use strict";
import * as vscode from "vscode";
import { join } from "path";
import * as fs from "fs";
import * as os from "os";
import { sleep } from "./misc";

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
): Promise<boolean> => {
  const cursorIndex = text.indexOf(CURSOR);
  const file = await createRandomFile(text.replace(CURSOR, ""), fileExtension);
  const document = await vscode.workspace.openTextDocument(file);
  const editor = await vscode.window.showTextDocument(document);

  if (cursorIndex >= 0) {
    const position = document.positionAt(cursorIndex);
    editor.selection = new vscode.Selection(position, position);
  }

  await sleep(200); // Wait a bit, otherwise onEnterRules randomly don't work on test scenarios

  await run(editor, document);
  if (document.isDirty) {
    return document.save().then(() => {
      return deleteFile(file);
    });
  } else {
    return deleteFile(file);
  }
};

const createRandomFile = (
  contents = "",
  fileExtension = "txt"
): Promise<vscode.Uri> => {
  return new Promise((resolve, reject) => {
    const tmpFile = join(os.tmpdir(), `${Math.random()}.${fileExtension}`);
    fs.writeFile(tmpFile, contents, (error) => {
      if (error) {
        return reject(error);
      }

      resolve(vscode.Uri.file(tmpFile));
    });
  });
};

const deleteFile = (file: vscode.Uri): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    fs.unlink(file.fsPath, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve(true);
      }
    });
  });
};
