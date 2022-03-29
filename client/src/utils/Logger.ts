import { OutputChannel } from "vscode";
import { Telemetry } from "../telemetry/types";

export class Logger {
  private outputChannel: OutputChannel;
  private telemetry: Telemetry;

  constructor(outputChannel: OutputChannel, telemetry: Telemetry) {
    this.outputChannel = outputChannel;
    this.telemetry = telemetry;
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
    this.telemetry.captureException(err);

    const message = err instanceof Error ? err.message : String(err);

    this.outputChannel.appendLine(
      `[Error  - ${new Date().toLocaleTimeString()}] ${message}`
    );
  }
}
