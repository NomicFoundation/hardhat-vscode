import * as path from "path";
import { Connection } from "vscode-languageserver/node";

export interface Logger {
  setWorkspace(rootUri: string): void;
  log(arg: string): void;
  info(arg: string): void;
  error(err: unknown): void;
  trace(message: string, verbose?: Record<string, unknown> | undefined): void;
}

export type ExceptionCapturer = (err: unknown) => void;

export class ConnectionLogger implements Logger {
  private connection: Connection;
  private exceptionCapturer: ExceptionCapturer;
  private workspaceName: string | null;

  constructor(connection: Connection, exceptionCapturer: ExceptionCapturer) {
    this.connection = connection;
    this.exceptionCapturer = exceptionCapturer;
    this.workspaceName = null;
  }

  setWorkspace(rootUri: string): void {
    this.workspaceName = path.basename(rootUri);
  }

  tryPrepend(arg: string) {
    if (this.workspaceName === null) {
      return arg;
    } else {
      return `[LS: ${this.workspaceName}] ${arg}`;
    }
  }

  log(arg: string): void {
    this.connection.console.log(this.tryPrepend(arg));
  }

  info(arg: string): void {
    this.connection.console.info(this.tryPrepend(arg));
  }

  error(err: unknown): void {
    this.exceptionCapturer(err);

    if (err instanceof Error) {
      this.connection.console.error(this.tryPrepend(err.message));
    } else {
      this.connection.console.error(this.tryPrepend(String(err)));
    }
  }

  trace(message: string, verbose?: Record<string, unknown> | undefined): void {
    this.connection.tracer.log(
      this.tryPrepend(message),
      JSON.stringify(verbose)
    );
  }
}
