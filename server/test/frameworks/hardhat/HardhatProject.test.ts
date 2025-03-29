/* eslint-disable @typescript-eslint/no-explicit-any */
import { assert } from "chai";
import { ChildProcess } from "child_process";
import {
  HardhatProject,
  WorkerStatus,
} from "../../../src/frameworks/Hardhat/HardhatProject";
import {
  BuildCompilationRequest,
  FileBelongsRequest,
  RequestMessage,
} from "../../../src/frameworks/Hardhat/worker/WorkerProtocol";
import { ServerState } from "../../../src/types";
import { CompilationDetails } from "../../../src/frameworks/base/CompilationDetails";

import { InitializationFailedError } from "../../../src/frameworks/base/Errors";

describe("HardhatProject", function () {
  let project: HardhatProject;
  const workerProcessMock = { connected: true } as ChildProcess;
  const serverStateMock = {
    logger: {},
  } as ServerState;

  beforeEach(async () => {
    project = new HardhatProject(
      serverStateMock,
      "/my_hardhat_project",
      "/my_hardhat_project/hardhat.config.ts"
    );

    project.workerProcess = workerProcessMock;
    project.workerStatus = WorkerStatus.RUNNING;
  });

  describe.only("buildCompilation", function () {
    let sendRequest: BuildCompilationRequest | null = null;
    const fakedCompilationResponse: CompilationDetails = {
      solcVersion: "0.8.20",
      input: {
        language: "solidity",
        sources: {},
        settings: { optimizer: {}, outputSelection: {} },
      },
    };

    beforeEach(async () => {
      sendRequest = null;

      workerProcessMock.send = function (request: RequestMessage) {
        sendRequest = request as BuildCompilationRequest;

        (project as any)._handleResponse(
          request.requestId,
          fakedCompilationResponse
        );

        return true;
      };
    });

    describe("when initialization was correct and the worker is operative", function () {
      it("sends a BuildCompilationRequest to the worker", async () => {
        await project.buildCompilation("./contracts/examples.sol", []);

        if (sendRequest === null) {
          assert.fail("Sent request should be defined");
        }

        const buildCompilationRequest = sendRequest as BuildCompilationRequest;

        assert.equal(
          buildCompilationRequest.sourceUri,
          "./contracts/examples.sol"
        );
      });
    });

    describe("when initialization failed", function () {
      it("throws an error indicating init failed", async () => {
        project.workerStatus = WorkerStatus.ERRORED;
        project.workerLoadFailureReason = "Problem loading Hardhat";

        let caughtException = false;
        try {
          await project.buildCompilation("./contracts/examples.sol", []);

          assert.fail(
            "The build compilation should be blocked because the underlying worker never started"
          );
        } catch (error) {
          caughtException = true;

          if (error === undefined) {
            assert.fail(
              "Expected an Error to be thrown on an uninitialized error"
            );
          }

          const uninitStruct = error as InitializationFailedError;

          assert.ok(uninitStruct._isInitializationFailedError);
          assert.equal(uninitStruct.error, "Problem loading Hardhat");
        }

        assert.ok(caughtException);
      });
    });

    describe("when initialization was correct but the worker is now stopped", function () {
      it("throws an error indicating the worker is not running", async () => {
        project.workerStatus = WorkerStatus.STOPPED;

        let caughtException = false;
        try {
          await project.buildCompilation("./contracts/examples.sol", []);

          assert.fail(
            "The build compilation should be blocked because the underlying worker is blocked"
          );
        } catch (error) {
          caughtException = true;
          if (!(error instanceof Error)) {
            assert.fail(
              "Expected an Error to be thrown on a stopped Worker process"
            );
          }
          assert.ok(error.message.includes("Worker is not running."));
        }

        assert.ok(caughtException);
      });
    });

    describe("when initialization was correct but the worker has disconnected (i.e. danger of EPIPE)", function () {
      it("throws an error indicating the worker is not connected", async () => {
        project.workerStatus = WorkerStatus.RUNNING;

        if (project.workerProcess === undefined) {
          return assert.fail("Worker process should be defined");
        }

        // Set `project.workerProcess.connected = false`
        Object.defineProperty(project.workerProcess, "connected", {
          value: false,
          writable: true,
        });

        let caughtException = false;
        try {
          await project.buildCompilation("./contracts/examples.sol", []);

          assert.fail(
            "The build compilation should be blocked because the underlying worker is blocked"
          );
        } catch (error) {
          caughtException = true;

          if (!(error instanceof Error)) {
            assert.fail(
              "Expected an Error to be thrown on a stopped Worker process"
            );
          }

          assert.ok(
            error.message.includes(
              "Hardhat Worker process is not connected - cannot send message."
            )
          );
        }

        assert.ok(caughtException);
      });
    });
  });

  describe("fileBelongs", function () {
    describe("when initialization was correct and worker is operative", function () {
      it("sends a FileBelongsRequest to the worker process", async () => {
        // Make the worker respond "true"
        (workerProcessMock as any).send = (request: FileBelongsRequest) => {
          (project as any)._handleResponse(request.requestId, true);
        };

        assert.isTrue(
          await project.fileBelongs(
            `/my_hardhat_project/any_folder/contract.sol`
          )
        );

        // Make the worker respond "false"
        (workerProcessMock as any).send = (request: FileBelongsRequest) => {
          (project as any)._handleResponse(request.requestId, false);
        };

        assert.isFalse(
          await project.fileBelongs(
            `/my_hardhat_project/any_folder/contract.sol`
          )
        );
      });
    });

    describe("when worker is not operative", function () {
      beforeEach(async () => {
        project.workerStatus = WorkerStatus.ERRORED;
      });

      it("claims every contract under project basePath, to avoid it being assigned other project", async () => {
        assert.deepEqual(
          await project.fileBelongs(
            `/my_hardhat_project/any_folder/contract.sol`
          ),
          { belongs: true, isLocal: false }
        );

        assert.include(
          await project.fileBelongs("/other_project/any_folder/contract.sol"),
          {
            belongs: false,
          }
        );
      });
    });
  });
});
