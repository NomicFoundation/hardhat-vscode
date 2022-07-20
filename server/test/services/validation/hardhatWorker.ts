import { HardhatProject } from "@analyzer/HardhatProject";
import { HardhatWorker } from "@services/validation/HardhatWorker";
import { assert } from "chai";
import * as sinon from "sinon";
import { setupMockLogger } from "../../helpers/setupMockLogger";

describe("Hardhat Worker", () => {
  const exampleProj: HardhatProject = {
    type: "hardhat",
    basePath: "/example",
    configPath: "/example/hardhat.config.js",
    workspaceFolder: {
      name: "example",
      uri: "/example",
    },
  };

  describe("initialization", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let mockProcessCreator: any;
    let hardhatWorker: HardhatWorker;

    beforeEach(() => {
      const mockLogger = setupMockLogger();
      mockProcessCreator = function () {
        return {
          on: sinon.spy(),
        };
      };

      hardhatWorker = new HardhatWorker(
        exampleProj,
        mockProcessCreator,
        mockLogger
      );
    });

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
  });

  describe("on exit", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let mockChildProcess: any;
    let hardhatWorker: HardhatWorker;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let openJob: any;

    beforeEach(() => {
      const mockLogger = setupMockLogger();
      mockChildProcess = {
        kill: sinon.spy(),
        on: sinon.spy(),
      };

      hardhatWorker = new HardhatWorker(
        exampleProj,
        () => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return mockChildProcess as any;
        },
        mockLogger
      );

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
