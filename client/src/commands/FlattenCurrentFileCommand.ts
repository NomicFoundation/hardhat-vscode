import { getCurrentOpenFile } from "../utils/workspace";
import { openNewDocument } from "../utils/window";
import HardhatTaskCommand from "./HardhatTaskCommand";

export default class FlattenCurrentFileCommand extends HardhatTaskCommand {
  private buffer: string[] = [];

  public name(): string {
    return "flattenCurrentFile";
  }

  public hardhatArgs(): string[] {
    const currentFile = getCurrentOpenFile();

    return ["flatten", currentFile?.uri.path ?? ""];
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
      this.outputChannel.show();
      return;
    }

    await openNewDocument(flattened);
  }

  public beforeExecute(): void {
    this.buffer = [];
  }
}
