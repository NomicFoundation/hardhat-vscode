"use strict";
import * as path from "path";
import * as vscode from "vscode";

export function getDocPath(dirname: string, p: string): string {
  // TO-DO: Refactor this
  return path.join(
    dirname.replace("/out/", "/").replace("\\out\\", "\\"),
    "testdata",
    p
  );
}

export function getDocUri(dirname: string, p: string): vscode.Uri {
  return vscode.Uri.file(getDocPath(dirname, p));
}
