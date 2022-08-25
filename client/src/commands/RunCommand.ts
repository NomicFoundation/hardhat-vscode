import * as vscode from "vscode";
import Command from "./Command";

export default class RunCommand extends Command {
  public async execute() {
    const choice = await vscode.window.showQuickPick([
      "Task with input",
      "Task without input",
    ]);

    if (choice === "Task with input") {
      const input = await vscode.window.showInputBox({
        prompt: "Enter your input",
      });
      await vscode.window.showInformationMessage(input ?? "Input canceled");
    } else {
      await vscode.window.showInformationMessage(
        choice ?? "Quickpick canceled"
      );
    }
  }

  public name() {
    return "run";
  }
}
