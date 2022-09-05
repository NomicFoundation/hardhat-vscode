import * as vscode from "vscode";
import { ExtensionState } from "../types";

export const findHardhatDirForFile = (
  state: ExtensionState,
  filePath: string
) => {
  return state.hardhatProjects.find((dir) => filePath.startsWith(dir));
};

/**
 * Try to get a hardhat project base directory
 * If there's only one project on the workspace, returns it
 * Otherwise tries to use current open file to select one
 */
export const ensureCurrentHardhatDir = async (state: ExtensionState) => {
  const currentFile = getCurrentOpenFile()?.uri.fsPath;

  let currentHardhatDir: string | undefined;

  if (currentFile === undefined && state.hardhatProjects.length === 1) {
    currentHardhatDir = state.hardhatProjects[0];
  } else if (currentFile === undefined) {
    await vscode.window.showErrorMessage(
      "Multiple hardhat projects found. Please open a project's file and try again."
    );
  } else {
    currentHardhatDir = findHardhatDirForFile(state, currentFile);
    if (currentHardhatDir === undefined) {
      await vscode.window.showErrorMessage(
        "Current file doesn't belong to a hardhat project."
      );
    }
  }
  return currentHardhatDir;
};

export const getCurrentOpenFile = () => {
  return vscode.window.activeTextEditor?.document;
};
