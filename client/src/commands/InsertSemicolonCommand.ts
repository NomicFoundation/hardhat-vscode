import vscode, { Position } from "vscode";
import Command from "./Command";

export default class InsertSemicolonCommand extends Command {
  public name(): string {
    return "solidity.insertSemicolon";
  }

  public async execute(position: Position) {
    const editor = vscode.window.activeTextEditor;

    if (editor === undefined) return;

    const document = editor.document;

    const lineText = document.lineAt(position.line).text;

    if (/.*;$/.test(lineText)) {
      return;
    }

    await editor.edit((builder) =>
      builder.insert(new Position(position.line, lineText.length), ";")
    );
  }
}
