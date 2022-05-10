import * as path from "path";
import { Connection } from "vscode-languageserver/node";
import type { Telemetry } from "../telemetry/types";

export interface Logger {
  setWorkspace(rootUri: string): void;
  log(arg: string): void;
  info(arg: string): void;
  error(err: unknown): void;
  trace(message: string, verbose?: {} | undefined): void;
}

export type ExceptionCapturer = (err: unknown) => void;

export class ConnectionLogger implements Logger {
  private connection: Connection;
  private telemetry: Telemetry;
  private workspaceName: string | null;

  constructor(connection: Connection, telemetry: Telemetry) {
    this.connection = connection;
    this.telemetry = telemetry;
    this.workspaceName = null;
  }

  public setWorkspace(rootUri: string): void {
    this.workspaceName = path.basename(rootUri);
  }

  public log(arg: string): void {
    this.connection.console.log(this._tryPrepend(arg));
  }

  public info(arg: string): void {
    this.connection.console.info(this._tryPrepend(arg));
  }

  public error(err: unknown): void {
    this.telemetry.captureException(err);

    if (err instanceof Error) {
      this.connection.console.error(this._tryPrepend(err.message));
    } else {
      this.connection.console.error(this._tryPrepend(String(err)));
    }
  }

  public trace(
    message: string,
    verbose?: Record<string, unknown> | undefined
  ): void {
    this.connection.tracer.log(
      this._tryPrepend(message),
      JSON.stringify(verbose)
    );
  }

  private _tryPrepend(arg: string) {
    if (this.workspaceName === null) {
      return arg;
    } else {
      return `[LS: ${this.workspaceName}] ${arg}`;
    }
  }
}
