/* eslint-disable no-console */
export enum LogLevel {
  TRACE,
  INFO,
  WARN,
  ERROR,
}

export class Logger {
  constructor(public level: LogLevel) {}

  public log(level: LogLevel, ...msgs: unknown[]) {
    if (level >= this.level) {
      console.log(...msgs)
    }
  }

  public trace(...msgs: unknown[]) {
    this.log(LogLevel.TRACE, ...msgs)
  }

  public info(...msgs: unknown[]) {
    this.log(LogLevel.INFO, ...msgs)
  }

  public warn(...msgs: unknown[]) {
    this.log(LogLevel.WARN, ...msgs)
  }

  public error(...msgs: unknown[]) {
    this.log(LogLevel.ERROR, ...msgs)
  }
}
