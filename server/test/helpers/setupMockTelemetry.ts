import { Transaction } from "@sentry/types";
import * as sinon from "sinon";
import { Telemetry } from "../../src/telemetry/types";

export function setupMockTelemetry(): Telemetry {
  return {
    init: sinon.spy(),
    captureException: sinon.spy(),
    trackTimingSync: (_taskName: string, action) => {
      return action();
    },
    startTransaction: (): Transaction => {
      return {
        startChild: () => {
          return {
            setStatus: sinon.spy(),
            finish: sinon.spy(),
          };
        },
        setStatus: sinon.spy(),
        finish: sinon.spy(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any;
    },
    enableHeartbeat: sinon.spy(),
    close: sinon.spy(),
  };
}
