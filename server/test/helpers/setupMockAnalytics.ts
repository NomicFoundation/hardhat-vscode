import * as sinon from "sinon";
import { Analytics } from "../../src/analytics/types";

export function setupMockAnalytics(): Analytics {
  return {
    init: sinon.spy(),
    sendTaskHit: sinon.spy(),
    trackTiming: (_taskName: string, action) => {
      return action();
    },
  };
}
