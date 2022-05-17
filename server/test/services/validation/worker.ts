/* eslint-disable @typescript-eslint/no-explicit-any */
import { dispatch } from "@services/validation/worker/dispatch";
import { assert } from "chai";
import sinon from "sinon";
import { WorkerState } from "../../../src/types";

describe("worker", () => {
  describe("validation job", () => {
    const exampleError = {
      component: "general",
      errorCode: "7920",
      formattedMessage:
        "DeclarationError: Identifier not found or not unique.\n" +
        "  --> contracts/Hover/HoverErrors.sol:11:22:\n" +
        "   |\n" +
        "11 |     type UserType is uint256a;\n" +
        "   |                      ^^^^^^^^\n" +
        "\n",
      message: "Identifier not found or not unique.",
      severity: "error",
      sourceLocation: {
        file: "contracts/Hover/HoverErrors.sol",
        start: 214,
        end: 222,
      },
      type: "DeclarationError",
    };

    it("should return errors from solc", async () => {
      const errors = [exampleError];

      const workerState = setupWorkerState(errors);

      await dispatch(workerState)({
        type: "VALIDATE",
        jobId: 1,
        uri: "/example/first.sol",
        documentText:
          "// SPDX-License-Identifier: GPL-3.0\npragma solidity >=0.8.2 <0.9.0;",
        openDocuments: [],
      });

      const sendSpy = workerState.send as any;

      assert(sendSpy.called);
      assert.deepStrictEqual(sendSpy.args[0][1], {
        type: "VALIDATION_COMPLETE",
        status: "VALIDATION_FAIL",
        jobId: 1,
        errors: [exampleError],
      });
    });

    it("should return 0 errors if file compiles", async () => {
      const errors: unknown[] = [];

      const workerState = setupWorkerState(errors);

      await dispatch(workerState)({
        type: "VALIDATE",
        jobId: 1,
        uri: "/example/first.sol",
        documentText:
          "// SPDX-License-Identifier: GPL-3.0\npragma solidity >=0.8.2 <0.9.0;",
        openDocuments: [],
      });

      const sendSpy = workerState.send as any;

      assert(sendSpy.called);
      assert.deepStrictEqual(sendSpy.args[0][1], {
        type: "VALIDATION_COMPLETE",
        status: "VALIDATION_PASS",
        jobId: 1,
        sources: ["/project/contracts/file1.sol"],
      });
    });
  });
});

function setupWorkerState(errors: unknown[]) {
  const mockLogger = {
    log: sinon.spy(),
    error: sinon.spy(),
  };

  const mockHre = {
    run: (param: unknown) => {
      if (param === "TASK_COMPILE_SOLIDITY_GET_SOURCE_PATHS") {
        return ["/project/contracts/file1.sol"];
      }

      if (param === "TASK_COMPILE_SOLIDITY_GET_SOURCE_NAMES") {
        return ["contracts/file1.sol"];
      }

      if (param === "TASK_COMPILE_SOLIDITY_GET_DEPENDENCY_GRAPH") {
        return { getResolvedFiles: () => [] };
      }

      if (param === "TASK_COMPILE_SOLIDITY_GET_COMPILATION_JOB_FOR_FILE") {
        return {
          getResolvedFiles: () => [],
          getSolcConfig: () => ({
            version: "0.8.0",
          }),
        };
      }

      if (param === "TASK_COMPILE_SOLIDITY_GET_COMPILER_INPUT") {
        return {
          language: "Solidity",
          sources: {
            "contracts/file1.sol": {
              content: "// SPDX-License-Identifier: GPL-3.0",
            },
          },
          settings: {
            optimizer: { enabled: false, runs: 200 },
            outputSelection: {
              "*": {
                "*": [
                  "abi",
                  "evm.bytecode",
                  "evm.deployedBytecode",
                  "evm.methodIdentifiers",
                  "metadata",
                ],
                "": ["ast"],
              },
            },
          },
        };
      }

      if (param === "TASK_COMPILE_SOLIDITY_COMPILE") {
        return {
          output: {
            contracts: {
              "": {
                Auction: null,
                AuctionBase: null,
              },
            },
            sources: {
              "contracts/file1.sol": { ast: {}, id: 0 },
            },
            errors,
          },
        };
      }

      return null;
    },
  } as any;

  const workerState: WorkerState = {
    current: null,
    buildQueue: [],
    buildJobs: {},
    hre: mockHre,
    solidityFilesCachePath: "/cache",
    SolidityFilesCache: {
      readFromFile: () => ({
        _cache: {
          _format: "hh-sol-cache-2",
          files: {},
        },
      }),
    },
    tasks: {
      TASK_COMPILE_SOLIDITY_GET_SOURCE_PATHS:
        "TASK_COMPILE_SOLIDITY_GET_SOURCE_PATHS",
      TASK_COMPILE_SOLIDITY_GET_SOURCE_NAMES:
        "TASK_COMPILE_SOLIDITY_GET_SOURCE_NAMES",
      TASK_COMPILE_SOLIDITY_GET_DEPENDENCY_GRAPH:
        "TASK_COMPILE_SOLIDITY_GET_DEPENDENCY_GRAPH",
      TASK_COMPILE_SOLIDITY_GET_COMPILATION_JOB_FOR_FILE:
        "TASK_COMPILE_SOLIDITY_GET_COMPILATION_JOB_FOR_FILE",
      TASK_COMPILE_SOLIDITY_GET_COMPILER_INPUT:
        "TASK_COMPILE_SOLIDITY_GET_COMPILER_INPUT",
      TASK_COMPILE_SOLIDITY_COMPILE: "TASK_COMPILE_SOLIDITY_COMPILE",
    },
    send: sinon.spy(),
    logger: mockLogger,
  };

  return workerState;
}
