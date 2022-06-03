/* eslint-disable @typescript-eslint/no-explicit-any */
import { dispatch } from "@services/validation/worker/dispatch";
import { assert } from "chai";
import sinon from "sinon";
import { HardhatError as FrameworkHardhatError } from "hardhat/internal/core/errors";
import { ErrorDescriptor } from "hardhat/internal/core/errors-list";
import type { SolcBuild } from "hardhat/types";
import { ValidateCommand, WorkerState } from "../../../src/types";

describe("worker", () => {
  describe("validation job", () => {
    const exampleValidation: ValidateCommand = {
      type: "VALIDATE",
      jobId: 1,
      projectBasePath: "/projects/example",
      uri: "/projects/example/contracts/first.sol",
      documentText:
        "// SPDX-License-Identifier: GPL-3.0\npragma solidity >=0.8.2 <0.9.0;",
      openDocuments: [],
    };

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

    describe("completes", () => {
      describe("without solc warnings/errors", () => {
        let workerState: WorkerState;
        let send: any;
        let capturedOptions: any;

        before(async () => {
          const errors: unknown[] = [];

          workerState = setupWorkerState({ errors });

          workerState.hre = setupMockHre({
            errors: [],
            interleavedActions: {
              TASK_COMPILE_SOLIDITY_RUN_SOLC: async (options) => {
                capturedOptions = options;
              },
            },
          });

          await dispatch(workerState)(exampleValidation);

          send = workerState.send;
        });

        it("should return 0 warnings/errors for the file", async () => {
          assert(send.called);
          assert.deepStrictEqual(send.args[0][0], {
            type: "VALIDATION_COMPLETE",
            status: "VALIDATION_PASS",
            jobId: 1,
            projectBasePath: "/projects/example",
            version: "0.8.0",
            sources: [
              "/projects/example/contracts/first.sol",
              "/projects/example/contracts/second.sol",
            ],
          });
        });

        it("should populate the compiler metadata cache", async () => {
          assert("0.8.0" in workerState.compilerMetadataCache);

          const buildInfoPromise = await workerState.compilerMetadataCache[
            "0.8.0"
          ];

          assert.deepStrictEqual(buildInfoPromise, {
            compilerPath:
              "/projects/example/node_modules/hardhat/compilers/compiler1",
            isSolcJs: false,
            version: "0.8.0",
            longVersion: "0.8.0",
          });
        });

        it("should pass overriden settings to solc", async () => {
          assert.deepStrictEqual(capturedOptions.input.settings, {
            optimizer: {
              enabled: false,
              runs: 1,
            },
            outputSelection: {},
          });
        });
      });

      describe("with solc warnings/errors", () => {
        it("should return warnings/errors", async () => {
          const errors = [exampleError];

          const workerState = setupWorkerState({ errors });

          await dispatch(workerState)(exampleValidation);

          const send = workerState.send as any;

          assert(send.called);
          assert.deepStrictEqual(send.args[0][0], {
            type: "VALIDATION_COMPLETE",
            status: "VALIDATION_FAIL",
            jobId: 1,
            projectBasePath: "/projects/example",
            version: "0.8.0",
            errors: [exampleError],
          });
        });
      });

      describe("with open editor files", () => {
        it("should pass the overriden files to solc", async () => {
          const workerState = setupWorkerState({ errors: [] });
          let capturedOptions: any;

          workerState.hre = setupMockHre({
            errors: [],
            interleavedActions: {
              TASK_COMPILE_SOLIDITY_RUN_SOLC: async (options) => {
                capturedOptions = options;
              },
            },
          });

          await dispatch(workerState)({
            ...exampleValidation,
            openDocuments: [
              {
                uri: "/projects/example/contracts/first.sol",
                documentText: "// expected",
              },
            ],
          });

          assert.deepStrictEqual(capturedOptions.input.sources, {
            "contracts/first.sol": {
              content: "// expected",
            },
          });
        });
      });

      describe("with cached compiler metadata", () => {
        it("should not call `TASK_COMPILE_SOLIDITY_GET_SOLC_BUILD`", async () => {
          const workerState = setupWorkerState({ errors: [] });

          workerState.compilerMetadataCache = {
            "0.8.0": new Promise((resolve) => {
              const solcBuild: SolcBuild = {
                version: "0.8.0",
                longVersion: "0.8.0",
                compilerPath:
                  "/projects/example/node_modules/hardhat/compilers/compiler1",
                isSolcJs: false,
              };
              resolve(solcBuild);
            }),
          };

          let solcBuildCalled = false;

          workerState.hre = setupMockHre({
            errors: [],
            interleavedActions: {
              TASK_COMPILE_SOLIDITY_GET_SOLC_BUILD: async () => {
                solcBuildCalled = true;
              },
            },
          });

          await dispatch(workerState)(exampleValidation);

          assert(
            !solcBuildCalled,
            "Solc build should not have been called, the cache should have been used"
          );
        });
      });
    });

    describe("errors", () => {
      describe("with a preprocess failure", () => {
        describe("hardhat error", () => {
          it("should return hardhat error", async () => {
            const exampleErrorDescriptor: ErrorDescriptor = {
              number: 123,
              message: "error message",
              title: "Example error",
              description: "This is an example error",
              shouldBeReported: false,
            };

            const throwOnDepGraph = () => {
              throw new FrameworkHardhatError(exampleErrorDescriptor);
            };

            const workerState = setupWorkerState({
              errors: [],
              throwOnDepGraph,
            });

            await dispatch(workerState)(exampleValidation);

            const send = workerState.send as any;

            assert(send.called);

            const { hardhatError, ...sentMessage } = send.args[0][0];

            assert.deepStrictEqual(sentMessage, {
              type: "VALIDATION_COMPLETE",
              status: "HARDHAT_ERROR",
              jobId: 1,
              projectBasePath: "/projects/example",
            });

            assert.deepStrictEqual(hardhatError, {
              name: "HardhatError",
              messageArguments: {},
              errorDescriptor: exampleErrorDescriptor,
            });
          });
        });

        describe("non-hardhat error", () => {
          it("should return an unknown error", async () => {
            const workerState = setupWorkerState({
              errors: [],
              throwOnDepGraph: () => {
                throw new Error("Non-hardhat error");
              },
            });

            await dispatch(workerState)(exampleValidation);

            const send = workerState.send as any;

            assert(send.called);

            const { error, ...sentMessage } = send.args[0][0];

            assert.deepStrictEqual(sentMessage, {
              type: "VALIDATION_COMPLETE",
              status: "UNKNOWN_ERROR",
              jobId: 1,
              projectBasePath: "/projects/example",
            });

            assert.deepStrictEqual(error.message, "Non-hardhat error");
            assert.deepStrictEqual(error.name, "Error");
          });
        });

        describe("exception", () => {
          it("should clear the worker state", async () => {
            const workerState = setupWorkerState({
              errors: [],
            });

            workerState.buildJobs = {
              bad: {
                uri: "bad",
                jobId: 99,
                openDocuments: [],
                documentText: "// bad",
                added: new Date(),
                projectBasePath: "/bad",
              },
            };

            await dispatch(workerState)(exampleValidation);

            assert.equal(workerState.current, null);
            assert.deepStrictEqual(workerState.buildJobs, {});
            assert.deepStrictEqual(workerState.buildQueue, []);
          });

          it("should ignore an issue with send", async () => {
            const workerState = setupWorkerState({
              errors: [],
            });

            workerState.send = () => {
              throw new Error("Send failed for this message");
            };

            workerState.buildJobs = {
              bad: {
                uri: "bad",
                jobId: 99,
                openDocuments: [],
                documentText: "// bad",
                added: new Date(),
                projectBasePath: "/bad",
              },
            };

            await dispatch(workerState)(exampleValidation);

            assert((workerState.logger.error as any).calledTwice);
          });
        });

        describe("build (compiler download) error", () => {
          let workerState: WorkerState;

          before(async () => {
            workerState = setupWorkerState({ errors: [] });

            workerState.hre = setupMockHre({
              errors: [],
              interleavedActions: {
                TASK_COMPILE_SOLIDITY_GET_SOLC_BUILD: async () => {
                  throw new Error("Could not download compiler");
                },
              },
            });

            await dispatch(workerState)(exampleValidation);
          });

          it("should send an error", async () => {
            const send = workerState.send as any;

            assert(send.called);

            const { error, ...sentMessage } = send.args[0][0];

            assert.deepStrictEqual(sentMessage, {
              type: "VALIDATION_COMPLETE",
              status: "UNKNOWN_ERROR",
              jobId: 1,
              projectBasePath: "/projects/example",
            });

            assert.deepStrictEqual(
              error.message,
              "Could not download compiler"
            );

            assert.deepStrictEqual(error.name, "Error");
          });

          it("should clear the compiler metadata cache", () => {
            assert(workerState.compilerMetadataCache["0.8.0"] === undefined);
          });
        });
      });

      describe("compilation input job returned reason", () => {
        it("should return hardhat error", async () => {
          const workerState = setupWorkerState({
            errors: [],
            compilationJob: {
              reason: "incompatible-overriden-solc-version",
            },
          });

          await dispatch(workerState)(exampleValidation);

          const send = workerState.send as any;

          assert(send.called);

          const sentMessage = send.args[0][0];

          assert.deepStrictEqual(sentMessage, {
            type: "VALIDATION_COMPLETE",
            status: "JOB_COMPLETION_ERROR",
            jobId: 1,
            projectBasePath: "/projects/example",
            reason: "incompatible-overriden-solc-version",
          });
        });
      });

      describe("into the catch all", () => {
        it("should return an unknown error", async () => {
          const workerState = setupWorkerState({
            errors: [],
            getResolvedFiles: () => {
              throw new Error("Non-hardhat error");
            },
          });

          await dispatch(workerState)(exampleValidation);

          const send = workerState.send as any;

          assert(send.called);

          const { error, ...sentMessage } = send.args[0][0];

          assert.deepStrictEqual(sentMessage, {
            type: "VALIDATION_COMPLETE",
            status: "UNKNOWN_ERROR",
            jobId: 1,
            projectBasePath: "/projects/example",
          });

          assert.deepStrictEqual(error.message, "Non-hardhat error");
          assert.deepStrictEqual(error.name, "Error");
        });
      });
    });

    describe("cancel", () => {
      // Setup the empty worker state, but
      // expose a promise/resolve pair that allows
      // us to "pause" the first messages build on the
      // `TASK_COMPILE_SOLIDITY_GET_SOURCE_PATHS` step.
      // We can then dispatch a second change to
      // completion, and finally unpause the first.
      it("should return a cancelled build job if one further change on same uri", async () => {
        // Arrange
        const workerState = setupWorkerState({
          errors: [],
        });

        const {
          function: startEndFunc,
          startPromise: getSourcesStartedPromise,
          finishResolve: resolveGetSourcesFinished,
        } = setupPausableFunction();

        workerState.hre = setupMockHre({
          errors: [],
          interleavedActions: {
            TASK_COMPILE_SOLIDITY_GET_SOURCE_PATHS: startEndFunc,
          },
        });

        // Act - send first change
        const dispatchPromise = dispatch(workerState)({
          ...exampleValidation,
          jobId: 1,
          uri: "/projects/example/contracts/first.sol",
        });

        // Pause on `TASK_COMPILE_SOLIDITY_GET_SOURCE_PATHS`
        await getSourcesStartedPromise;

        if (workerState.current === null) {
          return assert.fail("build is not in progress");
        }

        // Send the second change
        await dispatch(workerState)({
          ...exampleValidation,
          jobId: 2,
          uri: "/projects/example/contracts/first.sol",
        });

        // Unpause `TASK_COMPILE_SOLIDITY_GET_SOURCE_PATHS`
        resolveGetSourcesFinished();

        // Complete the first change message
        await dispatchPromise;

        // Assert
        const send = workerState.send as any;

        assert(send.called);

        // First call cancelled
        const firstJobValidationMessage = send.args[0][0];
        assert.deepStrictEqual(firstJobValidationMessage, {
          type: "VALIDATION_COMPLETE",
          status: "CANCELLED",
          jobId: 1,
          projectBasePath: "/projects/example",
        });

        // Second call completes and validates
        const secondJobValidationMessage = send.args[1][0];
        assert.deepStrictEqual(secondJobValidationMessage, {
          type: "VALIDATION_COMPLETE",
          status: "VALIDATION_PASS",
          jobId: 2,
          projectBasePath: "/projects/example",
          version: "0.8.0",
          sources: [
            "/projects/example/contracts/first.sol",
            "/projects/example/contracts/second.sol",
          ],
        });
      });

      // Setup a validation job that pauses twice,
      // once on `TASK_COMPILE_SOLIDITY_GET_DEPENDENCY_GRAPH` and
      // again on `TASK_COMPILE_SOLIDITY_COMPILE`.
      // In each pause a further change message is sent.
      it("should return 2 cancelled build jobs if two further changes on same uri", async () => {
        // Arrange
        const workerState = setupWorkerState({
          errors: [],
        });

        const {
          function: getDependencyGraph,
          startPromise: getDepenencyGraphStartPromise,
          finishResolve: resolveGetDepenencyGraphFinished,
        } = setupPausableFunction();

        const {
          function: runSolc,
          startPromise: runSolcStartPromise,
          finishResolve: runSolcFinished,
        } = setupPausableFunction();

        workerState.hre = setupMockHre({
          errors: [],
          interleavedActions: {
            TASK_COMPILE_SOLIDITY_GET_DEPENDENCY_GRAPH: getDependencyGraph,
            TASK_COMPILE_SOLIDITY_RUN_SOLC: runSolc,
          },
        });

        // Act - send first change
        const dispatchPromise = dispatch(workerState)({
          ...exampleValidation,
          jobId: 1,
          uri: "/projects/example/contracts/first.sol",
        });

        // Pause on `TASK_COMPILE_SOLIDITY_GET_DEPENDENCY_GRAPH`
        await getDepenencyGraphStartPromise;

        // Send the second change
        await dispatch(workerState)({
          ...exampleValidation,
          jobId: 2,
          uri: "/projects/example/contracts/first.sol",
        });

        // Unpause `TASK_COMPILE_SOLIDITY_GET_DEPENDENCY_GRAPH`
        resolveGetDepenencyGraphFinished();

        // Pause on `TASK_COMPILE_SOLIDITY_COMPILE`
        await runSolcStartPromise;

        // Send the third change
        await dispatch(workerState)({
          ...exampleValidation,
          jobId: 3,
          uri: "/projects/example/contracts/first.sol",
        });

        // Unpause on `TASK_COMPILE_SOLIDITY_COMPILE`
        runSolcFinished();

        // Complete the first change message
        await dispatchPromise;

        // Assert
        const send = workerState.send as any;

        assert(send.called);

        // First call cancelled
        const firstJobValidationMessage = send.args[0][0];
        assert.deepStrictEqual(firstJobValidationMessage, {
          type: "VALIDATION_COMPLETE",
          status: "CANCELLED",
          jobId: 1,
          projectBasePath: "/projects/example",
        });

        // Second call cancelled
        const secondJobValidationMessage = send.args[1][0];
        assert.deepStrictEqual(secondJobValidationMessage, {
          type: "VALIDATION_COMPLETE",
          status: "CANCELLED",
          jobId: 2,
          projectBasePath: "/projects/example",
        });

        // Third call completes and validates
        const thirdJobValidationMessage = send.args[2][0];
        assert.deepStrictEqual(thirdJobValidationMessage, {
          type: "VALIDATION_COMPLETE",
          status: "VALIDATION_PASS",
          jobId: 3,
          projectBasePath: "/projects/example",
          version: "0.8.0",
          sources: [
            "/projects/example/contracts/first.sol",
            "/projects/example/contracts/second.sol",
          ],
        });
      });

      it("should immediately cancel if change already in queue", async () => {
        // Arrange
        const workerState = setupWorkerState({
          errors: [],
        });

        const {
          function: getDependencyGraph,
          startPromise: getDepenencyGraphStartPromise,
          finishResolve: resolveGetDepenencyGraphFinished,
        } = setupPausableFunction();

        workerState.hre = setupMockHre({
          errors: [],
          interleavedActions: {
            TASK_COMPILE_SOLIDITY_GET_DEPENDENCY_GRAPH: getDependencyGraph,
          },
        });

        // Act - send first change
        const dispatchPromise = dispatch(workerState)({
          ...exampleValidation,
          jobId: 1,
          uri: "/projects/example/contracts/first.sol",
        });

        // Pause on `TASK_COMPILE_SOLIDITY_GET_DEPENDENCY_GRAPH`
        await getDepenencyGraphStartPromise;

        // Send the second change
        await dispatch(workerState)({
          ...exampleValidation,
          jobId: 2,
          uri: "/projects/example/contracts/first.sol",
        });

        // Send the third change
        await dispatch(workerState)({
          ...exampleValidation,
          jobId: 3,
          uri: "/projects/example/contracts/first.sol",
        });

        // Unpause `TASK_COMPILE_SOLIDITY_GET_DEPENDENCY_GRAPH`
        resolveGetDepenencyGraphFinished();

        // Complete the first change message
        await dispatchPromise;

        // Assert
        const send = workerState.send as any;

        assert(send.called);

        // First call cancelled
        const firstJobValidationMessage = send.args[0][0];
        assert.deepStrictEqual(firstJobValidationMessage, {
          type: "VALIDATION_COMPLETE",
          status: "CANCELLED",
          jobId: 2,
          projectBasePath: "/projects/example",
        });

        // Second call cancelled
        const secondJobValidationMessage = send.args[1][0];
        assert.deepStrictEqual(secondJobValidationMessage, {
          type: "VALIDATION_COMPLETE",
          status: "CANCELLED",
          jobId: 1,
          projectBasePath: "/projects/example",
        });

        // Third call completes and validates
        const thirdJobValidationMessage = send.args[2][0];
        assert.deepStrictEqual(thirdJobValidationMessage, {
          type: "VALIDATION_COMPLETE",
          status: "VALIDATION_PASS",
          jobId: 3,
          projectBasePath: "/projects/example",
          version: "0.8.0",
          sources: [
            "/projects/example/contracts/first.sol",
            "/projects/example/contracts/second.sol",
          ],
        });
      });

      // Setup a validation job that pauses on `TASK_COMPILE_SOLIDITY_GET_SOURCE_NAMES`
      // to allow a second change on a different uri. Both should complete and validate.
      it("should return two complete messages if two changes on different uris", async () => {
        // Arrange
        const workerState = setupWorkerState({
          errors: [],
        });

        const {
          function: pausableFunc,
          startPromise: getSourceNamesPromise,
          finishResolve: resolveGetSourceNamesFinished,
        } = setupPausableFunction();

        workerState.hre = setupMockHre({
          errors: [],
          interleavedActions: {
            TASK_COMPILE_SOLIDITY_GET_SOURCE_NAMES: pausableFunc,
          },
        });

        // Act - send first change
        const dispatchPromise = dispatch(workerState)({
          ...exampleValidation,
          jobId: 1,
          uri: "/projects/example/contracts/first.sol",
        });

        // Pause on `TASK_COMPILE_SOLIDITY_GET_SOURCE_NAMES`
        await getSourceNamesPromise;

        if (workerState.current === null) {
          return assert.fail("build is not in progress");
        }

        // Send the second change
        await dispatch(workerState)({
          ...exampleValidation,
          jobId: 2,
          uri: "/projects/example/contracts/second.sol",
        });

        // Unpause `TASK_COMPILE_SOLIDITY_GET_SOURCE_NAMES`
        resolveGetSourceNamesFinished();

        // Complete the first change message
        await dispatchPromise;

        // Assert
        const send = workerState.send as any;

        assert(send.called);

        // First call completes and validates
        const firstJobValidationMessage = send.args[0][0];
        assert.deepStrictEqual(firstJobValidationMessage, {
          type: "VALIDATION_COMPLETE",
          status: "VALIDATION_PASS",
          jobId: 1,
          projectBasePath: "/projects/example",
          version: "0.8.0",
          sources: [
            "/projects/example/contracts/first.sol",
            "/projects/example/contracts/second.sol",
          ],
        });

        // Second call completes and validates
        const secondJobValidationMessage = send.args[1][0];
        assert.deepStrictEqual(secondJobValidationMessage, {
          type: "VALIDATION_COMPLETE",
          status: "VALIDATION_PASS",
          jobId: 2,
          projectBasePath: "/projects/example",
          version: "0.8.0",
          sources: [
            "/projects/example/contracts/first.sol",
            "/projects/example/contracts/second.sol",
          ],
        });
      });

      it("should cancel on `TASK_COMPILE_SOLIDITY_GET_SOURCE_PATHS` error", () =>
        assertCancelOnFailureOf("TASK_COMPILE_SOLIDITY_GET_SOURCE_PATHS"));

      it("should cancel on `TASK_COMPILE_SOLIDITY_GET_SOURCE_NAMES` error", () =>
        assertCancelOnFailureOf("TASK_COMPILE_SOLIDITY_GET_SOURCE_NAMES"));

      it("should cancel on `TASK_COMPILE_SOLIDITY_GET_DEPENDENCY_GRAPH` error", () =>
        assertCancelOnFailureOf("TASK_COMPILE_SOLIDITY_GET_DEPENDENCY_GRAPH"));

      it("should cancel on `TASK_COMPILE_SOLIDITY_GET_COMPILATION_JOB_FOR_FILE` error", () =>
        assertCancelOnFailureOf(
          "TASK_COMPILE_SOLIDITY_GET_COMPILATION_JOB_FOR_FILE"
        ));

      it("should cancel on `TASK_COMPILE_SOLIDITY_GET_COMPILER_INPUT` error", () =>
        assertCancelOnFailureOf("TASK_COMPILE_SOLIDITY_GET_COMPILER_INPUT"));

      it("should cancel on `TASK_COMPILE_SOLIDITY_GET_SOLC_BUILD` error", () =>
        assertCancelOnFailureOf("TASK_COMPILE_SOLIDITY_GET_SOLC_BUILD"));

      it("should cancel on `TASK_COMPILE_SOLIDITY_RUN_SOLCJS` error", () =>
        assertCancelOnFailureOf("TASK_COMPILE_SOLIDITY_RUN_SOLCJS", {
          isSolcJs: true,
        }));

      it("should return a cancelled build job if reading the file cache errors", async () => {
        const {
          function: startEndFunc,
          startPromise: getReadFromFilePromise,
          finishResolve: resolveReadFromFile,
        } = setupPausableFunction();

        // Arrange
        const workerState = setupWorkerState({
          errors: [],
          readFromFile: async () => {
            await startEndFunc();

            return {
              _cache: {
                _format: "hh-sol-cache-2",
                files: {},
              },
            };
          },
        });

        // Act - send first change
        const dispatchPromise = dispatch(workerState)({
          ...exampleValidation,
          jobId: 1,
          uri: "/projects/example/contracts/first.sol",
        });

        // Pause on read from cache
        await getReadFromFilePromise;

        if (workerState.current === null) {
          return assert.fail("build is not in progress");
        }

        // Send the second change
        await dispatch(workerState)({
          ...exampleValidation,
          jobId: 2,
          uri: "/projects/example/contracts/first.sol",
        });

        // Unpause read from cache
        resolveReadFromFile();

        // Complete the first change message
        await dispatchPromise;

        // Assert
        const send = workerState.send as any;

        assert(send.called);

        // First call cancelled
        const firstJobValidationMessage = send.args[0][0];
        assert.deepStrictEqual(firstJobValidationMessage, {
          type: "VALIDATION_COMPLETE",
          status: "CANCELLED",
          jobId: 1,
          projectBasePath: "/projects/example",
        });

        // Second call completes and validates
        const secondJobValidationMessage = send.args[1][0];
        assert.deepStrictEqual(secondJobValidationMessage, {
          type: "VALIDATION_COMPLETE",
          status: "VALIDATION_PASS",
          jobId: 2,
          projectBasePath: "/projects/example",
          version: "0.8.0",
          sources: [
            "/projects/example/contracts/first.sol",
            "/projects/example/contracts/second.sol",
          ],
        });
      });
    });
  });
});

function setupWorkerState({
  errors,
  throwOnDepGraph,
  getResolvedFiles,
  readFromFile,
  compilationJob,
}: {
  errors: unknown[];
  throwOnDepGraph?: () => void;
  getResolvedFiles?: () => string[];
  readFromFile?: (path: string) => any;
  compilationJob?: any;
}) {
  const mockLogger = {
    log: sinon.spy(),
    error: sinon.spy(),
    trace: sinon.spy(),
  };

  const mockHre = setupMockHre({
    errors,
    throwOnDepGraph,
    getResolvedFiles,
    compilationJob,
  });

  const workerState: WorkerState = {
    current: null,
    buildQueue: [],
    buildJobs: {},
    hre: mockHre,
    solidityFilesCachePath: "/cache",
    SolidityFilesCache: {
      readFromFile:
        readFromFile ??
        (() => ({
          _cache: {
            _format: "hh-sol-cache-2",
            files: {},
          },
        })),
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
      TASK_COMPILE_SOLIDITY_GET_SOLC_BUILD:
        "TASK_COMPILE_SOLIDITY_GET_SOLC_BUILD",
      TASK_COMPILE_SOLIDITY_RUN_SOLCJS: "TASK_COMPILE_SOLIDITY_RUN_SOLCJS",
      TASK_COMPILE_SOLIDITY_RUN_SOLC: "TASK_COMPILE_SOLIDITY_RUN_SOLC",
    },
    compilerMetadataCache: {},
    send: sinon.spy(),
    logger: mockLogger,
  };

  return workerState;
}

function setupMockHre({
  errors,
  throwOnDepGraph,
  getResolvedFiles,
  interleavedActions,
  compilationJob,
  isSolcJs = false,
}: {
  errors: unknown[];
  throwOnDepGraph?: () => void;
  getResolvedFiles?: () => string[];
  compilationJob?: any;
  interleavedActions?: {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    TASK_COMPILE_SOLIDITY_GET_SOURCE_PATHS?: () => Promise<void>;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    TASK_COMPILE_SOLIDITY_GET_SOURCE_NAMES?: () => Promise<void>;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    TASK_COMPILE_SOLIDITY_GET_DEPENDENCY_GRAPH?: () => Promise<void>;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    TASK_COMPILE_SOLIDITY_GET_COMPILATION_JOB_FOR_FILE?: () => Promise<void>;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    TASK_COMPILE_SOLIDITY_GET_COMPILER_INPUT?: () => Promise<void>;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    TASK_COMPILE_SOLIDITY_GET_SOLC_BUILD?: () => Promise<void>;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    TASK_COMPILE_SOLIDITY_RUN_SOLCJS?: (options: unknown) => Promise<void>;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    TASK_COMPILE_SOLIDITY_RUN_SOLC?: (options: unknown) => Promise<void>;
  };
  isSolcJs?: boolean;
}) {
  const compilationFiles: Array<{
    absolutePath: string;
    content: { rawContent: string };
  }> = [
    {
      absolutePath: "/projects/example/contracts/first.sol",
      content: { rawContent: "// SPDX-License-Identifier: GPL-3.0" },
    },
  ];

  const mockHre = {
    run: async (param: unknown, passedOptions: unknown) => {
      if (param === "TASK_COMPILE_SOLIDITY_GET_SOURCE_PATHS") {
        if (
          interleavedActions?.TASK_COMPILE_SOLIDITY_GET_SOURCE_PATHS !==
          undefined
        ) {
          await interleavedActions?.TASK_COMPILE_SOLIDITY_GET_SOURCE_PATHS();
        }

        return [
          "/projects/example/contracts/first.sol",
          "/projects/example/contracts/second.sol",
        ];
      }

      if (param === "TASK_COMPILE_SOLIDITY_GET_SOURCE_NAMES") {
        if (
          interleavedActions?.TASK_COMPILE_SOLIDITY_GET_SOURCE_NAMES !==
          undefined
        ) {
          await interleavedActions?.TASK_COMPILE_SOLIDITY_GET_SOURCE_NAMES();
        }

        return ["contracts/first.sol", "contracts/second.sol"];
      }

      if (param === "TASK_COMPILE_SOLIDITY_GET_DEPENDENCY_GRAPH") {
        if (throwOnDepGraph !== undefined) {
          return throwOnDepGraph();
        }

        if (
          interleavedActions?.TASK_COMPILE_SOLIDITY_GET_DEPENDENCY_GRAPH !==
          undefined
        ) {
          await interleavedActions?.TASK_COMPILE_SOLIDITY_GET_DEPENDENCY_GRAPH();
        }

        return {
          getResolvedFiles:
            getResolvedFiles ??
            (() => [
              {
                absolutePath: "/projects/example/contracts/first.sol",
                content: { rawContent: "// SPDX-License-Identifier: GPL-3.0" },
              },
              {
                absolutePath: "/projects/example/contracts/second.sol",
                content: { rawContent: "// SPDX-License-Identifier: GPL-3.0" },
              },
            ]),
        };
      }

      if (param === "TASK_COMPILE_SOLIDITY_GET_COMPILATION_JOB_FOR_FILE") {
        if (
          interleavedActions?.TASK_COMPILE_SOLIDITY_GET_COMPILATION_JOB_FOR_FILE !==
          undefined
        ) {
          await interleavedActions?.TASK_COMPILE_SOLIDITY_GET_COMPILATION_JOB_FOR_FILE();
        }

        return compilationJob !== undefined
          ? compilationJob
          : {
              getResolvedFiles: getResolvedFiles ?? (() => compilationFiles),
              getSolcConfig: () => ({
                version: "0.8.0",
              }),
            };
      }

      if (param === "TASK_COMPILE_SOLIDITY_GET_COMPILER_INPUT") {
        if (
          interleavedActions?.TASK_COMPILE_SOLIDITY_GET_COMPILER_INPUT !==
          undefined
        ) {
          await interleavedActions?.TASK_COMPILE_SOLIDITY_GET_COMPILER_INPUT();
        }

        const sources = Object.fromEntries(
          compilationFiles.map(({ absolutePath, content: { rawContent } }) => [
            absolutePath.replace("/projects/example/", ""),
            { content: rawContent },
          ])
        );

        return {
          language: "Solidity",
          sources,
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

      if (param === "TASK_COMPILE_SOLIDITY_GET_SOLC_BUILD") {
        if (
          interleavedActions?.TASK_COMPILE_SOLIDITY_GET_SOLC_BUILD !== undefined
        ) {
          await interleavedActions?.TASK_COMPILE_SOLIDITY_GET_SOLC_BUILD();
        }

        return {
          version: "0.8.0",
          longVersion: "0.8.0",
          compilerPath:
            "/projects/example/node_modules/hardhat/compilers/compiler1",
          isSolcJs,
        };
      }

      if (param === "TASK_COMPILE_SOLIDITY_RUN_SOLCJS") {
        if (
          interleavedActions?.TASK_COMPILE_SOLIDITY_RUN_SOLCJS !== undefined
        ) {
          await interleavedActions?.TASK_COMPILE_SOLIDITY_RUN_SOLCJS(
            passedOptions
          );
        }

        return {
          contracts: {
            "": {
              Auction: null,
              AuctionBase: null,
            },
          },
          sources: {
            "contracts/first.sol": { ast: {}, id: 0 },
            "contracts/second.sol": { ast: {}, id: 0 },
          },
          errors,
        };
      }

      if (param === "TASK_COMPILE_SOLIDITY_RUN_SOLC") {
        if (interleavedActions?.TASK_COMPILE_SOLIDITY_RUN_SOLC !== undefined) {
          await interleavedActions?.TASK_COMPILE_SOLIDITY_RUN_SOLC(
            passedOptions
          );
        }

        return {
          contracts: {
            "": {
              Auction: null,
              AuctionBase: null,
            },
          },
          sources: {
            "contracts/first.sol": { ast: {}, id: 0 },
            "contracts/second.sol": { ast: {}, id: 0 },
          },
          errors,
        };
      }

      return null;
    },
  } as any;

  return mockHre;
}

function setupPromiseAndResolve() {
  let externalResolve: () => void = () => {
    return;
  };

  const promise = new Promise<void>((resolve) => {
    externalResolve = resolve;
  });

  return {
    promise,
    resolve: externalResolve,
  };
}

function setupPausableFunction() {
  const { promise: startPromise, resolve: startResolve } =
    setupPromiseAndResolve();

  const { promise: finishPromise, resolve: finishResolve } =
    setupPromiseAndResolve();

  const startEndFunc = async () => {
    startResolve();

    return finishPromise;
  };

  return {
    startPromise,
    finishResolve,
    function: startEndFunc,
  };
}

async function assertCancelOnFailureOf(
  step: string,
  options?: { isSolcJs: boolean }
) {
  const exampleValidation: ValidateCommand = {
    type: "VALIDATE",
    jobId: 1,
    projectBasePath: "/projects/example",
    uri: "/projects/example/contracts/first.sol",
    documentText:
      "// SPDX-License-Identifier: GPL-3.0\npragma solidity >=0.8.2 <0.9.0;",
    openDocuments: [],
  };

  // Arrange
  const workerState = setupWorkerState({
    errors: [],
  });

  const {
    function: startEndFunc,
    startPromise: getSourcesStartedPromise,
    finishResolve: resolveGetSourcesFinished,
  } = setupPausableFunction();

  workerState.hre = setupMockHre({
    errors: [],
    interleavedActions: {
      [step]: startEndFunc,
    },
    isSolcJs: options?.isSolcJs !== undefined ? options?.isSolcJs : false,
  });

  // Act - send first change
  const dispatchPromise = dispatch(workerState)({
    ...exampleValidation,
    jobId: 1,
    uri: "/projects/example/contracts/first.sol",
  });

  // Pause
  await getSourcesStartedPromise;

  if (workerState.current === null) {
    return assert.fail("build is not in progress");
  }

  // Send the second change
  await dispatch(workerState)({
    ...exampleValidation,
    jobId: 2,
    uri: "/projects/example/contracts/first.sol",
  });

  // Unpause
  resolveGetSourcesFinished();

  // Complete the first change message
  await dispatchPromise;

  // Assert
  const send = workerState.send as any;

  assert(send.called);

  // First call cancelled
  const firstJobValidationMessage = send.args[0][0];
  assert.deepStrictEqual(firstJobValidationMessage, {
    type: "VALIDATION_COMPLETE",
    status: "CANCELLED",
    jobId: 1,
    projectBasePath: "/projects/example",
  });

  // Second call completes and validates
  const secondJobValidationMessage = send.args[1][0];
  assert.deepStrictEqual(secondJobValidationMessage, {
    type: "VALIDATION_COMPLETE",
    status: "VALIDATION_PASS",
    jobId: 2,
    projectBasePath: "/projects/example",
    version: "0.8.0",
    sources: [
      "/projects/example/contracts/first.sol",
      "/projects/example/contracts/second.sol",
    ],
  });
}
