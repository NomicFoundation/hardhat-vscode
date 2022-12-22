import vscode from "vscode";
import { getCurrentOpenFile } from "../utils/workspace";
import { openNewDocument } from "../utils/window";
import HardhatTaskCommand from "./HardhatTaskCommand";

export default class FlattenCurrentFileCommand extends HardhatTaskCommand {
  private buffer: string[] = [];

  public name(): string {
    return "solidity.hardhat.flattenCurrentFile";
  }

  public hardhatArgs(): string[] {
    const currentFile = getCurrentOpenFile();

    return ["flatten", currentFile?.uri.fsPath ?? ""];
  }

  public progressLabel(): string {
    return "Flattening file";
  }

  public onStdout(data: string): void {
    this.buffer.push(data.toString());
  }

  public async onClose(_status: number): Promise<void> {
    const flattened = this.buffer.join("");
    if (typeof flattened !== "string" || flattened.trim().length === 0) {
      return;
    }

    await openNewDocument(flattened);
  }

  public async beforeExecute() {
    this.buffer = [];

    const currentFile = getCurrentOpenFile();

    if (currentFile === undefined) {
      return false;
    } else if (currentFile.isDirty) {
      await vscode.window.showWarningMessage(
        "Please save your file before flattening"
      );
      return false;
    } else {
      return true;
    }
  }
}
