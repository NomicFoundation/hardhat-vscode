import * as vscode from "vscode";
import { ExtensionState } from "../types";

import CompileCommand from "../commands/CompileCommand";
import FlattenCurrentFileCommand from "../commands/FlattenCurrentFileCommand";
import CleanCommand from "../commands/CleanCommand";

const commandClasses = [
  CompileCommand,
  FlattenCurrentFileCommand,
  CleanCommand,
];

export function setupCommands(state: ExtensionState) {
  for (const commandClass of commandClasses) {
    const command = new commandClass(state.commandsOutputChannel);
    const disposable = vscode.commands.registerCommand(
      `hardhat.solidity.${command.name()}`,
      () => command.execute()
    );
    state.context.subscriptions.push(disposable);
  }
}
