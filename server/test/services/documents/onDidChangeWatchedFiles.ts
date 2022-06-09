import { NoProject } from "@analyzer/NoProject";
import { ClientTrackingState, ISolFileEntry } from "@common/types";
import { onDidChangeWatchedFiles } from "@services/documents/onDidChangeWatchedFiles";
import { assert } from "chai";
import sinon from "sinon";
import { FileChangeType } from "vscode-languageserver-protocol";
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
        changes: [{ type: 1, uri: "/projects/js-example/hardhat.config.js" }],
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

  describe("change to solidity file", () => {
    let exampleSolFileEntry: ISolFileEntry;

    beforeEach(() => {
      exampleSolFileEntry = {
        project: {
          type: "hardhat",
          configPath: "/projects/example/hardhat.config.ts",
          basePath: "/projects/example",
        },
        tracking: ClientTrackingState.UNTRACKED,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any;
    });

    describe("that is untracked", () => {
      it("should invalidate the preprocessing cache on the worker", async () => {
        const mockWorkerProcess = {
          invalidatePreprocessingCache: sinon.spy(() => true),
        };

        const serverState = setupServerState(mockWorkerProcess);

        serverState.solFileIndex = {
          "/projects/example/contracts/a-solidity-file.sol":
            exampleSolFileEntry,
        };

        const [response] = await onDidChangeWatchedFiles(serverState)({
          changes: [
            {
              type: FileChangeType.Changed,
              uri: "/projects/example/contracts/a-solidity-file.sol",
            },
          ],
        });

        assert.deepStrictEqual(response, true);
        assert(mockWorkerProcess.invalidatePreprocessingCache.called);
      });

      it("should gracefully fail if no entry for the uri", async () => {
        const serverState = setupServerState();

        serverState.solFileIndex = {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          "/projects/example/contracts/a-solidity-file.sol": undefined as any,
        };

        serverState.workerProcesses = {};

        const [response] = await onDidChangeWatchedFiles(serverState)({
          changes: [
            { type: 1, uri: "/projects/example/contracts/a-solidity-file.sol" },
          ],
        });

        assert.deepStrictEqual(response, false);
      });

      it("should gracefully fail if not in a hardhat project", async () => {
        const serverState = setupServerState();

        serverState.solFileIndex = {
          "/projects/example/contracts/a-solidity-file.sol": {
            ...exampleSolFileEntry,
            project: new NoProject(),
          },
        };

        serverState.workerProcesses = {};

        const [response] = await onDidChangeWatchedFiles(serverState)({
          changes: [
            { type: 1, uri: "/projects/example/contracts/a-solidity-file.sol" },
          ],
        });

        assert.deepStrictEqual(response, false);
      });

      it("should gracefully fail if no worker process for config file", async () => {
        const serverState = setupServerState();

        serverState.solFileIndex = {
          "/projects/example/contracts/a-solidity-file.sol":
            exampleSolFileEntry,
        };

        serverState.workerProcesses = {};

        const [response] = await onDidChangeWatchedFiles(serverState)({
          changes: [
            { type: 1, uri: "/projects/example/contracts/a-solidity-file.sol" },
          ],
        });

        assert.deepStrictEqual(response, false);
      });

      it("should gracefully fail on an unexpected exception", async () => {
        const serverState = setupServerState();

        serverState.solFileIndex = {
          "/projects/example/contracts/a-solidity-file.sol":
            exampleSolFileEntry,
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        serverState.projects["/projects/example"] = undefined as any;

        const [response] = await onDidChangeWatchedFiles(serverState)({
          changes: [
            { type: 1, uri: "/projects/example/contracts/a-solidity-file.sol" },
          ],
        });

        assert.deepStrictEqual(response, false);
      });
    });

    describe("that is tracked", () => {
      it("should be ignored", async () => {
        const mockWorkerProcess = {
          invalidatePreprocessingCache: sinon.spy(() => true),
        };

        const serverState = setupServerState(mockWorkerProcess);

        serverState.solFileIndex = {
          "/projects/example/contracts/a-solidity-file.sol": {
            ...exampleSolFileEntry,
            tracking: ClientTrackingState.TRACKED,
          },
        };

        const [response] = await onDidChangeWatchedFiles(serverState)({
          changes: [
            {
              type: FileChangeType.Changed,
              uri: "/projects/example/contracts/a-solidity-file.sol",
            },
          ],
        });

        assert.deepStrictEqual(response, false);
        assert(mockWorkerProcess.invalidatePreprocessingCache.notCalled);
      });
    });
  });
});

function setupServerState(mockWorkerProcess?: {
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
