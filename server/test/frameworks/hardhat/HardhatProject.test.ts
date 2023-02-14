/* eslint-disable @typescript-eslint/no-explicit-any */
import { assert } from "chai";
import { ChildProcess } from "child_process";
import {
  HardhatProject,
  WorkerStatus,
} from "../../../src/frameworks/Hardhat/HardhatProject";
import { FileBelongsRequest } from "../../../src/frameworks/Hardhat/worker/WorkerProtocol";
import { ServerState } from "../../../src/types";

describe("HardhatProject", function () {
  let project: HardhatProject;
  const workerProcessMock = {} as ChildProcess;
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
          { belongs: true, isLocal: true }
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
