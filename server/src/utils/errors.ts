export class TimeoutError extends Error {
  constructor(ms: number) {
    super(`Timed out: ${ms}ms`);
    this.name = "TimeoutError";
  }
}
