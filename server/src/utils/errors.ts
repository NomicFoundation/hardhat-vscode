export class TimeoutError extends Error {
  constructor(ms: number) {
    super(`Timed out: ${ms}ms`);
    this.name = "TimeoutError";
  }
}

// When we can't find the forge binary
export class ForgeResolveError extends Error {}

export function isModuleNotFoundError(
  err: unknown
): err is Error & { code?: string } {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    typeof (err as any).code === "string" &&
    ((err as any).code === "MODULE_NOT_FOUND" ||
      (err as any).code === "ERR_MODULE_NOT_FOUND")
  );
}
