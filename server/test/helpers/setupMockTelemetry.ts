import * as sinon from "sinon";
import { Telemetry } from "../../src/telemetry/types";

export function setupMockTelemetry(): Telemetry {
  return {
    init: sinon.spy(),
    captureException: sinon.spy(),
    close: sinon.spy(),
  };
}
