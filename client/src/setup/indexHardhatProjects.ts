import path from "path";
import vscode from "vscode";
import { ExtensionState } from "../types";

export async function indexHardhatProjects(state: ExtensionState) {
  const hardhatConfigs = await vscode.workspace.findFiles(
    "**/hardhat.config.{ts,js}",
    "**/node_modules/**"
  );

  state.hardhatProjects = hardhatConfigs.map((hardhatConfig) =>
    path.dirname(hardhatConfig.fsPath)
  );
}
