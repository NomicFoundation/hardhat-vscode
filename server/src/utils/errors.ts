export class TimeoutError extends Error {
  constructor(ms: number) {
    super(`Timed out: ${ms}ms`);
    this.name = "TimeoutError";
  }
}

// When we can't find the forge binary
export class ForgeResolveError extends Error {}
