import { OutputChannel } from "vscode";

export class Logger {
  private outputChannel: OutputChannel;

  constructor(outputChannel: OutputChannel) {
    this.outputChannel = outputChannel;
  }

  log(text: string) {
    this.outputChannel.appendLine(text);
  }

  info(text: string) {
    this.outputChannel.appendLine(
      `[Info  - ${new Date().toLocaleTimeString()}] ${text}`
    );
  }

  error(err: unknown) {
    const message = err instanceof Error ? err.message : String(err);

    this.outputChannel.appendLine(
      `[Error  - ${new Date().toLocaleTimeString()}] ${message}`
    );
  }
}
