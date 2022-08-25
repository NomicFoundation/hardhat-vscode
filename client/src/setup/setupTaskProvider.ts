import { ExtensionContext } from "vscode";
import * as vscode from "vscode";
import { Logger } from "../utils/Logger";
import { HardhatTaskProvider } from "../taskProvider/HardhatTaskProvider";

export function setupTaskProvider({
  context,
}: {
  context: ExtensionContext;
  logger: Logger;
}) {
  const taskProvider = new HardhatTaskProvider();
  const disposable = vscode.tasks.registerTaskProvider("hardhat", taskProvider);
  context.subscriptions.push(disposable);
  return disposable;
}
