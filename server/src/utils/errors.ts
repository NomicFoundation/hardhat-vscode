/* eslint-disable @typescript-eslint/no-explicit-any */
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

export function hasErrorDescriptor(
  err: unknown
): err is { errorDescriptor: { title: string; description: string } } {
  if (typeof err !== "object" || err === null) {
    return false;
  }

  return "errorDescriptor" in err;
}

/**
 * Coerce a thrown value into an `Error`.
 *
 * Sentry can only group an `Error`. Anything else becomes a synthetic,
 * stackless event titled by the thrown value's own keys, so unrelated sites
 * collapse into a single issue. Wrapping gives the event the stack of the
 * `catch` that reported it, and keeps the original on `cause`.
 */
export function asError(err: unknown): Error {
  if (err instanceof Error) {
    return err;
  }

  return new Error(nonErrorMessage(err), { cause: err });
}

function nonErrorMessage(err: unknown): string {
  if (typeof err === "string") {
    return err;
  }

  if (hasErrorDescriptor(err)) {
    return err.errorDescriptor.title;
  }

  if (typeof err === "object" && err !== null) {
    const keys = Object.keys(err).sort().join(", ");

    return keys === ""
      ? "Non-Error object thrown"
      : `Non-Error object thrown with keys: ${keys}`;
  }

  return `Non-Error value thrown: ${typeof err}`;
}
