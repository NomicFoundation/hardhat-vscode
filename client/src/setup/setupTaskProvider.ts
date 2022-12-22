import * as vscode from "vscode";
import { HardhatTaskProvider } from "../taskProvider/HardhatTaskProvider";
import { ExtensionState } from "../types";

export function setupTaskProvider(state: ExtensionState) {
  const taskProvider = new HardhatTaskProvider(state);

  const disposable = vscode.tasks.registerTaskProvider("hardhat", taskProvider);

  state.context.subscriptions.push(disposable);

  return disposable;
}
