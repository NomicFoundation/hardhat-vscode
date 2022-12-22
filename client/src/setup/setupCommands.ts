import * as vscode from "vscode";
import { ExtensionState } from "../types";

import CompileCommand from "../commands/CompileCommand";
import FlattenCurrentFileCommand from "../commands/FlattenCurrentFileCommand";
import CleanCommand from "../commands/CleanCommand";
import InsertSemicolonCommand from "../commands/InsertSemicolonCommand";
import Command from "../commands/Command";

type ICommandClass = new (state: ExtensionState) => Command;

const commandClasses: ICommandClass[] = [
  CompileCommand,
  FlattenCurrentFileCommand,
  CleanCommand,
  InsertSemicolonCommand,
];

export async function setupCommands(state: ExtensionState) {
  for (const commandClass of commandClasses) {
    const command = new commandClass(state);

    const disposable = vscode.commands.registerCommand(
      command.name(),
      (...args) => command.execute(...args)
    );

    state.context.subscriptions.push(disposable);
  }
}
