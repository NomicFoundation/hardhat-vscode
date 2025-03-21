import * as sinon from "sinon";
import { Telemetry } from "../../src/telemetry/types";

export function setupMockTelemetry(): Telemetry {
  return {
    init: sinon.spy(),
    captureException: sinon.spy(),
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
    enableHeartbeat: sinon.spy(),
    close: sinon.spy(),
  };
}
