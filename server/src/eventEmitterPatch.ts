/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { EventEmitter } from "node:events";
import * as Sentry from "@sentry/node";

const eventEmiterCreationStack: WeakMap<EventEmitter, string> = new WeakMap();

const errorEventEmitters: WeakMap<Error, EventEmitter> = new WeakMap();

const errorEventToEmittionStack: WeakMap<Error, string> = new WeakMap();

const EventEmitterAsAny: any = EventEmitter;

const originalInit = EventEmitterAsAny.init;

EventEmitterAsAny.init = function init(...args: any[]) {
  eventEmiterCreationStack.set(
    this,
    new Error().stack ?? "<No stack available>"
  );

  return originalInit.apply(this, args);
};

const originalEmit: typeof EventEmitter.prototype.emit =
  EventEmitter.prototype.emit;

EventEmitter.prototype.emit = function emit(eventName, ...otherArgs) {
  // This if is more complex than needed to make ts happy
  if (eventName === "error" && Array.isArray(otherArgs) && "0" in otherArgs) {
    const error: Error = otherArgs[0];

    errorEventToEmittionStack.set(
      error,
      new Error().stack ?? "<No stack available>"
    );
    errorEventEmitters.set(otherArgs[0], this);
  }

  return originalEmit.apply(this, [eventName, ...otherArgs]);
};

function processUncaughtException(error: Error) {
  const eventEmittionStack = errorEventToEmittionStack.get(error);
  const eventEmitter = errorEventEmitters.get(error);

  const eventEmitterCreationStack =
    eventEmitter !== undefined
      ? eventEmiterCreationStack.get(eventEmitter)
      : undefined;

  if (eventEmitterCreationStack !== undefined) {
    Sentry.addBreadcrumb({
      message: "eventEmitterCreationStack",
      data: {
        stack: eventEmitterCreationStack,
      },
    });
  }

  if (eventEmittionStack !== undefined) {
    Sentry.addBreadcrumb({
      message: "eventEmittionStack",
      data: {
        stack: eventEmittionStack,
      },
    });
  }
}

process.on("uncaughtException", function (error) {
  processUncaughtException(error);
});
