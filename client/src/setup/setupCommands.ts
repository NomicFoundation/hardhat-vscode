/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from "vscode";
import { ExtensionState } from "../types";

import CompileCommand from "../commands/CompileCommand";
import FlattenCurrentFileCommand from "../commands/FlattenCurrentFileCommand";
import CleanCommand from "../commands/CleanCommand";
import Command from "../commands/Command";
import { errorWrap } from "../utils/errors";

type ICommandClass = new (state: ExtensionState) => Command;

const commandClasses: ICommandClass[] = [
  CompileCommand,
  FlattenCurrentFileCommand,
  CleanCommand,
];

export async function setupCommands(state: ExtensionState) {
  for (const commandClass of commandClasses) {
    const command = new commandClass(state);

    const disposable = vscode.commands.registerCommand(
      command.name(),
      errorWrap(state.logger, (...args) => command.execute(...args))
    );

    state.context.subscriptions.push(disposable);
  }
}
