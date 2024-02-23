import { Transaction } from "@sentry/types";
import * as sinon from "sinon";
import { Telemetry } from "../../src/telemetry/types";
import { setupMockAnalytics } from "./setupMockAnalytics";

export function setupMockTelemetry(): Telemetry {
  return {
    init: sinon.spy(),
    captureException: sinon.spy(),
    analytics: setupMockAnalytics(),
    trackTiming: async (_taskName: string, action) => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (await action(sinon.spy() as any)).result;
      } catch {
        return null;
      }
    },
    trackTimingSync: (_taskName, action) => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const actionResponse = action(sinon.spy() as any);

        return actionResponse.result;
      } catch {
        return null;
      }
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
