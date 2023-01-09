import * as Sentry from "@sentry/node";

const EXCLUDE_PATTERNS = [/error loading hre/gi];

export function sentryEventFilter(event: Sentry.Event): boolean {
  for (const value of event.exception?.values ?? []) {
    if (
      value.type === "Error" &&
      EXCLUDE_PATTERNS.some((pattern) => value.value?.match(pattern))
    ) {
      return false;
    }
  }

  return true;
}
