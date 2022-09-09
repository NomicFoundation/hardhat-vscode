/* eslint-disable @typescript-eslint/no-explicit-any */
import { HardhatProject } from "@analyzer/HardhatProject";
import { HardhatWorker } from "@services/validation/HardhatWorker";
import { assert } from "chai";
import * as sinon from "sinon";
import { Connection } from "vscode-languageserver";
import { setupMockConnection } from "../../helpers/setupMockConnection";
import { setupMockLogger } from "../../helpers/setupMockLogger";

describe("Hardhat Worker", () => {
  const exampleProj: HardhatProject = {
    type: "hardhat",
    basePath: "/example",
    configPath: "/example/hardhat.config.js",
    remappings: [],
    workspaceFolder: {
      name: "example",
      uri: "/example",
    },
  };
  const mockConnection = setupMockConnection();
  let mockChildProcess: any;
  const processFactory = () => {
    return mockChildProcess;
  };
  const mockLogger = setupMockLogger();
  let hardhatWorker: HardhatWorker;

  beforeEach(() => {
    // Instantiate mocks before each testcase
    mockChildProcess = {
      callbacks: {},
      kill: sinon.spy(),
      on(event: string, callback: () => {}) {
        this.callbacks[event] = callback;
      },
    };
    hardhatWorker = new HardhatWorker(
      exampleProj,
      processFactory,
      mockLogger,
      mockConnection as unknown as Connection
    );
  });

  describe("initialization", () => {
    it("should set the worker to STARTING", () => {
      hardhatWorker.init();

      assert.equal(hardhatWorker.status, "STARTING");
    });

    describe("when already starting", () => {
      it("should error", () => {
        hardhatWorker.status = "STARTING";

        assert.throws(
          () => hardhatWorker.init(),
          "Cannot start a worker thread that has already started"
        );
      });
    });

    describe("when already running", () => {
      it("should error", () => {
        hardhatWorker.status = "RUNNING";

        assert.throws(
          () => hardhatWorker.init(),
          "Cannot start a worker thread that has already started"
        );
      });
    });

    describe("on child's initialization complete", function () {
      it("sends a custom notification", async () => {
        hardhatWorker.init();
        const onMessageCallback = mockChildProcess.callbacks.message;
        onMessageCallback({ type: "INITIALISATION_COMPLETE" });
        sinon.assert.calledWith(
          mockConnection.sendNotification,
          "custom/worker-initialized",
          { projectBasePath: exampleProj.basePath }
        );
      });
    });
  });

  describe("on exit", () => {
    let openJob: any;

    beforeEach(() => {
      openJob = {
        resolve: sinon.spy(),
        reject: sinon.spy(),
      };

      hardhatWorker.jobs.example = openJob;

      hardhatWorker.init();
    });

    describe("when running", () => {
      beforeEach(() => {
        hardhatWorker.status = "RUNNING";

        hardhatWorker.handleExit(1, null);
      });

      it("should cancel any open jobs", () => {
        assert.lengthOf(Object.values(hardhatWorker.jobs), 0);
        sinon.assert.called(openJob.reject);
      });

      it("should restart", () => {
        sinon.assert.called(mockChildProcess.kill);
      });

      it("should set the worker to STARTING", () => {
        assert.equal(hardhatWorker.status, "STARTING");
      });
    });

    describe("when starting", () => {
      beforeEach(() => {
        hardhatWorker.handleExit(1, null);
      });

      it("should not restart", () => {
        sinon.assert.notCalled(mockChildProcess.kill);
      });

      it("should set the worker to INITIALIZATION_ERRORED", () => {
        assert.equal(hardhatWorker.status, "INITIALIZATION_ERRORED");
      });
    });

    describe("termination through signal", () => {
      beforeEach(() => {
        hardhatWorker.handleExit(1, "SIGTERM");
      });

      it("should cancel any open jobs", () => {
        assert.lengthOf(Object.values(hardhatWorker.jobs), 0);
        sinon.assert.called(openJob.reject);
      });

      it("should not restart", () => {
        sinon.assert.notCalled(mockChildProcess.kill);
      });

      it("should set the worker back to UNINITIALIZED", () => {
        assert.equal(hardhatWorker.status, "UNINITIALIZED");
      });
    });
  });
});
