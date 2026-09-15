// eslint-disable-next-line @typescript-eslint/naming-convention
import * as Sentry from "@sentry/node";

/**
 * Exceptions not worth reporting.
 *
 * Each of these is either a state a user's project is legitimately in, or a
 * failure in something that is not ours to fix.
 */
const EXCLUDE_PATTERNS = [
  // The Hardhat 3 runtime environment failed to initialise - usually a project
  // whose dependencies are not installed.
  /^hre not initialized$/i,
  // A request the editor withdrew before we answered it.
  /^Canceled$/i,
  // The language client shutting down under a request.
  /Client is not running/i,
  /Timeout awaiting 'request'/i,
  // A user's project whose dependencies are not installed.
  /Cannot find (module|package)/i,
];

export function sentryEventFilter(event: Sentry.Event): boolean {
  for (const value of event.exception?.values ?? []) {
    // Both the type and the message, because an error can carry the whole
    // story in its `name` and have no message at all.
    const candidates = [value.type, value.value];

    if (
      EXCLUDE_PATTERNS.some((pattern) =>
        candidates.some(
          (candidate) => candidate !== undefined && pattern.test(candidate)
        )
      )
    ) {
      return false;
    }
  }

  return true;
}
