import { WorkerProcess } from "./WorkerProcess";
import { LogMessage } from "./WorkerProtocol";

export class WorkerLogger {
  constructor(private _workerProcess: WorkerProcess) {}

  public trace(msg: string) {
    this._log(msg, LogLevel.TRACE);
  }

  public info(msg: string) {
    this._log(msg, LogLevel.INFO);
  }

  public error(msg: string) {
    this._log(msg, LogLevel.ERROR);
  }

  private _log(msg: string, level: LogLevel) {
    void this._workerProcess.send(new LogMessage(msg, level));
  }
}

export enum LogLevel {
  TRACE,
  INFO,
  ERROR,
}
