// This file and server/src/telemetry/anonymization.ts are identical, at some point we may consider merging them

/* eslint-disable @typescript-eslint/strict-boolean-expressions */
import { Event, Exception } from "@sentry/core";

const ANONYMIZED_FILE = "<user-file>";

export function anonymizeEvent<TEvent extends Event>(event: TEvent): TEvent {
  const scrubbedEvent: TEvent = {
    ...event,
    message: anonymizeString(event.message), // Scrub message
    server_name: undefined, // Remove server_name
    breadcrumbs: anonymizeBreadcrumbs(event.breadcrumbs), // Anonimized breadcrumbs
    exception: anonymizeExceptions(event.exception), // Anonimized exception
    user: anonymizeUser(event.user), // Anonimized user
  };

  return scrubbedEvent;
}

function anonymizeString(str?: string) {
  if (str === undefined) {
    return undefined;
  }

  const pathRegex = /\S+[/\\]\S+/g;
  const internalRegex = /.*nomicfoundation\.hardhat-solidity[^(\\|/)]*/;

  return str.replace(pathRegex, (match) => {
    if (internalRegex.test(match) && match.endsWith(".js")) {
      return `<extension-root>${match.replace(internalRegex, "")}`;
    } else {
      return ANONYMIZED_FILE;
    }
  });
}

function anonymizeBreadcrumbs(
  breadcrumbs?: Event["breadcrumbs"]
): Event["breadcrumbs"] {
  if (breadcrumbs === undefined) {
    return undefined;
  }

  return breadcrumbs.map((breadcrumb) => {
    return {
      ...breadcrumb,
      message: anonymizeString(breadcrumb.message),
    };
  });
}

function anonymizeExceptions(
  exception?: Event["exception"]
): Event["exception"] {
  if (exception?.values === undefined) {
    return exception;
  }

  return {
    values: exception.values.map((exceptionValue) => {
      return {
        ...exceptionValue,
        value: anonymizeString(exceptionValue.value),
        module: anonymizeString(exceptionValue.module),
        stacktrace: anonymizeStackTrace(exceptionValue.stacktrace),
      };
    }),
  };
}

function anonymizeUser(user?: Event["user"]): Event["user"] {
  if (user === undefined) {
    return user;
  }

  return {
    ...user,
    username: undefined,
    email: undefined,
  };
}

function anonymizeStackTrace(
  stacktrace?: Exception["stacktrace"]
): Exception["stacktrace"] {
  if (stacktrace?.frames === undefined) {
    return stacktrace;
  }

  return {
    frames: stacktrace.frames.map((frame) => {
      return {
        ...frame,
        filename: anonymizeString(frame.filename),
        abs_path: anonymizeString(frame.abs_path),
        module: anonymizeString(frame.module),
      };
    }),
  };
}
