/* eslint-disable @typescript-eslint/no-explicit-any */

import { Logger } from "./Logger";

// Wraps a function that may throw an error. It captures the error (sentry) and rethrows it
export function errorWrapSync<T extends (...args: any[]) => any>(
  logger: Logger,
  fn: T
) {
  return (...args: Parameters<T>): ReturnType<T> => {
    try {
      return fn(...args);
    } catch (error: unknown) {
      logger.error(error);
      throw error;
    }
  };
}

export function errorWrap<T extends (...args: any[]) => Promise<any>>(
  logger: Logger,
  fn: T
) {
  return async (...args: Parameters<T>): Promise<Awaited<ReturnType<T>>> => {
    try {
      return await fn(...args);
    } catch (error: unknown) {
      logger.error(error);
      throw error;
    }
  };
}
