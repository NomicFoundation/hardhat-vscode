import * as path from "path";
import { serializeError } from "serialize-error";
import { Connection } from "vscode-languageserver/node";
import type { Telemetry } from "../telemetry/types";

export interface Logger {
  setWorkspace(rootUri: string): void;
  log(arg: string): void;
  info(arg: string): void;
  error(err: unknown): void;
  trace(message: string, verbose?: {} | undefined): void;
  trackTime<T>(description: string, callback: () => Promise<T>): Promise<T>;
  tag?: string;
}

export type ExceptionCapturer = (err: unknown) => void;

export class ConnectionLogger implements Logger {
  private connection: Connection;
  private telemetry: Telemetry;
  private workspaceName: string | null;
  public tag?: string;

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
    } else if (this._hasErrorDescriptor(err)) {
      this.connection.console.error(
        this._tryPrepend(
          `${err.errorDescriptor.title}: ${err.errorDescriptor.description}`
        )
      );
    } else {
      this.connection.console.error(
        this._tryPrepend(JSON.stringify(serializeError(err)))
      );
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
    const text = this._printTag() + arg;
    if (this.workspaceName === null) {
      return text;
    } else {
      return `[LS: ${this.workspaceName}] ${text}`;
    }
  }

  private _hasErrorDescriptor(
    err: unknown
  ): err is { errorDescriptor: { title: string; description: string } } {
    if (typeof err !== "object" || err === null) {
      return false;
    }

    return "errorDescriptor" in err;
  }

  public async trackTime<T>(
    description: string,
    callback: () => Promise<T>
  ): Promise<T> {
    this.trace(`${description}: Start`);
    const now = process.hrtime.bigint();
    const ret = await callback();
    this.trace(
      `${description}: End (${Number(process.hrtime.bigint() - now) / 1e6} ms)`
    );
    return ret;
  }

  private _printTag() {
    return this.tag !== undefined ? `[${this.tag}] ` : "";
  }
}
