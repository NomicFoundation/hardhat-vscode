"use strict";
import * as path from "path";
import * as vscode from "vscode";
import { getRootPath } from "./workspace";

const TEST_PROJECTS_DIR = "projects";

export function getTestContractUri(contract: string): vscode.Uri {
  return vscode.Uri.file(path.join(getRootPath(), TEST_PROJECTS_DIR, contract));
}
