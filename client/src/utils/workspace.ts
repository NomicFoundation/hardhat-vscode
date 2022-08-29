import path from "path";
import * as vscode from "vscode";

export const findHardhatConfigs = async () => {
  return vscode.workspace.findFiles(
    "**/hardhat.config.{ts,js}",
    "**/node_modules/**"
  );
};

export const findHardhatDirs = async () => {
  const hardhatConfigs = await findHardhatConfigs();
  return hardhatConfigs.map((hardhatConfig) =>
    path.dirname(hardhatConfig.fsPath)
  );
};

export const findHardhatDirForFile = async (filePath: string) => {
  const hardhatDirs = await findHardhatDirs();

  return hardhatDirs.find((dir) => filePath.startsWith(dir));
};

/**
 * Try to get a hardhat project base directory
 * If there's only one project on the workspace, returns it
 * Otherwise tries to use current open file to select one
 */
export const ensureCurrentHardhatDir = async () => {
  const currentFile = getCurrentOpenFile()?.uri.fsPath;
  const allHardhatDirs = await findHardhatDirs();

  let currentHardhatDir: string | undefined;

  if (currentFile === undefined && allHardhatDirs.length === 1) {
    currentHardhatDir = allHardhatDirs[0];
  } else if (currentFile === undefined) {
    await vscode.window.showErrorMessage(
      "Multiple hardhat projects found. Please open a project's file and try again."
    );
  } else {
    currentHardhatDir = await findHardhatDirForFile(currentFile);
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
