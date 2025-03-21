import { SPAN_STATUS_OK, SPAN_STATUS_ERROR } from "@sentry/core";
import { SpanStatusCode } from "@sentry/core/build/types/types-hoist/spanStatus";

export const OK = { code: SPAN_STATUS_OK as SpanStatusCode, message: "ok" };
export const INTERNAL_ERROR = {
  code: SPAN_STATUS_ERROR as SpanStatusCode,
  message: "internal_error",
};
export const DEADLINE_EXCEEDED = {
  code: SPAN_STATUS_ERROR as SpanStatusCode,
  message: "deadline_exceeded",
};
export const FAILED_PRECONDITION = {
  code: SPAN_STATUS_ERROR as SpanStatusCode,
  message: "failed_precondition",
};
export const INVALID_ARGUMENT = {
  code: SPAN_STATUS_ERROR as SpanStatusCode,
  message: "invalid_argument",
};
