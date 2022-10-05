import * as sinon from "sinon";
import { Logger } from "@utils/Logger";

export function setupMockLogger(): Logger {
  return {
    setWorkspace: sinon.spy(),
    log: sinon.spy(),
    info: sinon.spy(),
    error: sinon.spy(),
    trace: sinon.spy(),
    trackTime: sinon.spy(),
  };
}
