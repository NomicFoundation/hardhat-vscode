import { onDidChangeWatchedFiles } from "@services/documents/onDidChangeWatchedFiles";
import { assert } from "chai";
import sinon from "sinon";
import { ServerState } from "../../../src/types";
import { setupMockLogger } from "../../helpers/setupMockLogger";
import { setupMockTelemetry } from "../../helpers/setupMockTelemetry";

describe("On did change watched files", () => {
  describe("change to hardhat config file", () => {
    it("should restart the worker", async () => {
      const mockWorkerProcess = {
        restart: sinon.spy(),
      };

      const serverState = setupServerState(mockWorkerProcess);

      const [response] = await onDidChangeWatchedFiles(serverState)({
        changes: [{ type: 1, uri: "/projects/example/hardhat.config.ts" }],
      });

      assert.deepStrictEqual(response, true);
      assert(mockWorkerProcess.restart.called);
    });

    it("should gracefully fail if no project for config file", async () => {
      const serverState = setupServerState();
      serverState.projects = {};

      const [response] = await onDidChangeWatchedFiles(serverState)({
        changes: [{ type: 1, uri: "/projects/example/hardhat.config.ts" }],
      });

      assert.deepStrictEqual(response, false);
    });

    it("should gracefully fail if no worker process for config file", async () => {
      const serverState = setupServerState();
      serverState.workerProcesses = {};

      const [response] = await onDidChangeWatchedFiles(serverState)({
        changes: [{ type: 1, uri: "/projects/example/hardhat.config.ts" }],
      });

      assert.deepStrictEqual(response, false);
    });

    it("should gracefully fail on an unexpected exception", async () => {
      const serverState = setupServerState();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      serverState.projects["/projects/example"] = undefined as any;

      const [response] = await onDidChangeWatchedFiles(serverState)({
        changes: [{ type: 1, uri: "/projects/example/hardhat.config.ts" }],
      });

      assert.deepStrictEqual(response, false);
    });
  });
});

function setupServerState(mockWorkerProcess?: {
  restart: () => void;
}): ServerState {
  const serverState = {
    projects: {
      "/projects/example": {
        configPath: "/projects/example/hardhat.config.ts",
        basePath: "/projects/example",
      },
    },
    workerProcesses: {
      "/projects/example": mockWorkerProcess ?? {
        restart: sinon.spy(),
      },
    },
    telemetry: setupMockTelemetry(),
    logger: setupMockLogger(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;

  return serverState;
}
