import * as vscode from "vscode";
import { ExtensionState } from "../types";

import CompileCommand from "../commands/CompileCommand";
import TestCommand from "../commands/TestCommand";
import FlattenCommand from "../commands/FlattenCommand";
import CleanCommand from "../commands/CleanCommand";
import RunCommand from "../commands/RunCommand";

const commandClasses = [
  CompileCommand,
  TestCommand,
  FlattenCommand,
  CleanCommand,
  RunCommand,
];

export function setupCommands(state: ExtensionState) {
  for (const commandClass of commandClasses) {
    const command = new commandClass(getOutputChannel(state));
    const disposable = vscode.commands.registerCommand(
      `hardhat.solidity.${command.name()}`,
      () => command.execute()
    );
    state.context.subscriptions.push(disposable);
  }
}

const getOutputChannel = (state: ExtensionState) => {
  if (!state.commandsOutputChannel) {
    state.commandsOutputChannel =
      vscode.window.createOutputChannel("Hardhat Commands");
  }
  return state.commandsOutputChannel;
};
