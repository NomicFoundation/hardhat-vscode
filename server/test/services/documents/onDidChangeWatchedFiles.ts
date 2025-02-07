import sinon from "sinon";
import { ServerState } from "../../../src/types";
import { setupMockLogger } from "../../helpers/setupMockLogger";
import { setupMockTelemetry } from "../../helpers/setupMockTelemetry";

describe("On did change watched files", () => {
  it("should call projects callback", async () => {
    // TODO
  });
});

function _setupServerState(mockWorkerProcess?: {
  restart?: () => void;
  invalidatePreprocessingCache?: () => void;
}): ServerState {
  const serverState = {
    projects: {
      "/projects/example": {
        configPath: "/projects/example/hardhat.config.ts",
        basePath: "/projects/example",
      },
      "/projects/js-example": {
        configPath: "/projects/js-example/hardhat.config.js",
        basePath: "/projects/js-example",
      },
    },
    workerProcesses: {
      "/projects/example": {
        restart: sinon.spy(),
        invalidatePreprocessingCache: sinon.spy(),
        ...mockWorkerProcess,
      },
      "/projects/js-example": {
        restart: sinon.spy(),
        invalidatePreprocessingCache: sinon.spy(),
        ...mockWorkerProcess,
      },
    },
    telemetry: setupMockTelemetry(),
    logger: setupMockLogger(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;

  return serverState;
}
