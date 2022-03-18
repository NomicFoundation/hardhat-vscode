import * as sinon from "sinon";
import { Analytics } from "../../src/analytics/types";

export function setupMockAnalytics(): Analytics {
  return {
    init: sinon.spy(),
    sendPageView: sinon.spy(),
  };
}
