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

  describe("buildCompilation", function () {
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

      // Set the process as connected
      (project as any).workerProcess.connected = true;

      workerProcessMock.send = function (request: RequestMessage) {
        sendRequest = request as BuildCompilationRequest;

        (project as any)._handleResponse(
          request.requestId,
          fakedCompilationResponse
        );

        return true;
      };

      (project as any).logger = {
        error: () => {
          // ignore error logging
        },
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

        assertResponseAndErrorHandlersHaveBeenCleanedUp(project);
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

        assertResponseAndErrorHandlersHaveBeenCleanedUp(project);
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

        assertResponseAndErrorHandlersHaveBeenCleanedUp(project);
      });
    });

    describe("when initialization was correct but the worker has disconnected (i.e. danger of EPIPE)", function () {
      it("throws an error indicating the worker is not connected", async () => {
        project.workerStatus = WorkerStatus.RUNNING;

        (project as any).workerProcess.connected = false;

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

    describe("when initialization was correct but the sending from the process fails (even though it appeared connected)", function () {
      it("throws an error indicating the worker could not be communicated with", async () => {
        project.workerStatus = WorkerStatus.RUNNING;

        if (project.workerProcess === undefined) {
          return assert.fail("Worker process should be defined");
        }

        workerProcessMock.send = function (
          request: RequestMessage,
          onFailFn: any
        ) {
          sendRequest = request as BuildCompilationRequest;

          onFailFn(new Error("Fake failed to send message"));

          return false;
        };

        let caughtException = false;
        try {
          await project.buildCompilation("./contracts/examples.sol", []);

          assert.fail(
            "The build compilation should be blocked because the underlying worker could not be sent to"
          );
        } catch (error) {
          caughtException = true;

          if (!(error instanceof Error)) {
            assert.fail(
              "Expected an Error to be thrown on a stopped Worker that can't be reached"
            );
          }

          assert.equal(error.message, "Fake failed to send message");
        }

        assert.ok(caughtException);

        assertResponseAndErrorHandlersHaveBeenCleanedUp(project);
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

function assertResponseAndErrorHandlersHaveBeenCleanedUp(
  hardhatProject: HardhatProject
) {
  const errorHandlers: { [requestId: number]: (result: any) => void } = (
    hardhatProject as any
  )._onError;
  const responseHandlers: { [requestId: number]: (result: any) => void } = (
    hardhatProject as any
  )._onResponse;

  assert.equal(
    Object.keys(errorHandlers).length,
    0,
    "The error handlers have not been cleaned up"
  );
  assert.equal(
    Object.keys(responseHandlers).length,
    0,
    "The response handlers have not been cleaned up"
  );
}
