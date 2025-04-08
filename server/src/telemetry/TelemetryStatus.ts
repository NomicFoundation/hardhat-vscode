import { SPAN_STATUS_OK, SPAN_STATUS_ERROR, SpanStatus } from "@sentry/core";

export const OK = { code: SPAN_STATUS_OK, message: "ok" } as SpanStatus;
export const INTERNAL_ERROR = {
  code: SPAN_STATUS_ERROR,
  message: "internal_error",
} as SpanStatus;
export const DEADLINE_EXCEEDED = {
  code: SPAN_STATUS_ERROR,
  message: "deadline_exceeded",
} as SpanStatus;
export const FAILED_PRECONDITION = {
  code: SPAN_STATUS_ERROR,
  message: "failed_precondition",
} as SpanStatus;
export const INVALID_ARGUMENT = {
  code: SPAN_STATUS_ERROR,
  message: "invalid_argument",
} as SpanStatus;
