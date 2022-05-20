import { validate } from "@services/validation/validate";
import { Logger } from "@utils/Logger";
import { assert } from "chai";
import * as path from "path";
import sinon from "sinon";
import { TextDocument } from "vscode-languageserver-textdocument";
import {
  CancelledValidation,
  HardhatCompilerError,
  HardhatThrownError,
  JobCompletionError,
  UnknownError,
  ValidationCompleteMessage,
  ValidationJobStatusNotification,
} from "../../../src/types";
import { forceToUnixStyle } from "../../helpers/forceToUnixStyle";
import { prependWithSlash } from "../../helpers/prependWithSlash";
import { setupMockConnection } from "../../helpers/setupMockConnection";
import { setupMockLanguageServer } from "../../helpers/setupMockLanguageServer";
import { setupMockLogger } from "../../helpers/setupMockLogger";
import { waitUntil } from "../../helpers/waitUntil";

describe("Parser", () => {
  describe("Validation", function () {
    const workspaceFolder = prependWithSlash(
      forceToUnixStyle(path.join(__dirname, "../.."))
    );

    const projectUri = forceToUnixStyle(
      path.join(__dirname, "hardhat.config.js")
    );

    const basicUri = forceToUnixStyle(
      path.join(__dirname, "testData", "Basic.sol")
    );

    const blockedUri = forceToUnixStyle(
      path.join(__dirname, "testData", "Blocked.sol")
    );

    let mockConnection: ReturnType<typeof setupMockConnection>;

    const fakeTelemetry = {
      trackTiming: async (_name: string, action: () => Promise<void>) => {
        return action();
      },
    };

    describe("validation fail - solc warnings/errors from worker", () => {
      describe("pass through", () => {
        const exampleError: HardhatCompilerError = {
          sourceLocation: {
            file: basicUri,
            start: 5,
            end: 15,
          },
          errorCode: "101",
          severity: "error",
          message: "It went wrong!",
          formattedMessage: "-",
          type: "DeclarationError",
          component: "general",
        };

        beforeEach(async () => {
          ({ connection: mockConnection } = await setupMockLanguageServer({
            projects: { [workspaceFolder]: [projectUri] },
            documents: [{ uri: basicUri, analyze: true }],
            errors: [exampleError],
          }));

          try {
            await waitUntil(
              () => mockConnection.sendDiagnostics.calledOnce,
              100,
              1000
            );
          } catch {
            assert.fail("Send diagnostics not called");
          }
        });

        it("should convert error to diagnostic", async () => {
          assert(mockConnection.sendDiagnostics.calledOnce);
          const { uri, diagnostics } =
            mockConnection.sendDiagnostics.firstCall.firstArg;

          assert.equal(uri, basicUri);
          assert.deepStrictEqual(diagnostics, [
            {
              code: "101",
              message: "It went wrong!",
              severity: 1,
              source: "solidity",
              range: {
                start: {
                  character: 5,
                  line: 0,
                },
                end: {
                  character: 15,
                  line: 0,
                },
              },
            },
          ]);
        });
      });

      describe("enhancement", () => {
        describe.skip("function level error/warning", () => {
          const mutabliltyRestrictToViewWarning: HardhatCompilerError = {
            component: "general",
            errorCode: "2018",
            formattedMessage:
              "Warning: Function state mutability can be restricted to view\n  --> contracts/Greeter.sol:14:2:\n   |\n14 | \tfunction greet() public returns (string memory) {\n   | \t^ (Relevant source part starts here and spans across multiple lines).\n\n",
            message: "Function state mutability can be restricted to view",
            severity: "warning",
            sourceLocation: {
              file: basicUri,
              start: 445,
              end: 556,
            },
            type: "DeclarationError",
          };

          beforeEach(async () => {
            ({ connection: mockConnection } = await setupMockLanguageServer({
              projects: { [workspaceFolder]: [projectUri] },
              documents: [{ uri: basicUri, analyze: true }],
              errors: [mutabliltyRestrictToViewWarning],
            }));

            try {
              await waitUntil(
                () => mockConnection.sendDiagnostics.calledOnce,
                100,
                1000
              );
            } catch {
              assert.fail("Send diagnostics not called");
            }
          });

          it("should convert constrain range of mutability warning", async () => {
            assert(mockConnection.sendDiagnostics.calledOnce);

            const { uri, diagnostics } =
              mockConnection.sendDiagnostics.firstCall.firstArg;

            assert.equal(uri, basicUri);
            assert.deepStrictEqual(diagnostics, [
              {
                code: "2018",
                message: "Function state mutability can be restricted to view",
                severity: 2,
                source: "solidity",
                range: {
                  start: {
                    line: 24,
                    character: 11,
                  },
                  end: {
                    line: 24,
                    character: 16,
                  },
                },
                data: {
                  functionSourceLocation: {
                    start: 445,
                    end: 556,
                  },
                },
              },
            ]);
          });
        });

        describe("contract level error/warning", () => {
          describe('3656 - Contract "Counter" should be marked as abstract', () => {
            const interfacesUri = forceToUnixStyle(
              path.join(__dirname, "testData", "Interfaces.sol")
            );

            const markAsAbstractError: HardhatCompilerError = {
              component: "general",
              errorCode: "3656",
              formattedMessage: "",
              message: 'Contract "Counter" should be marked as abstract.',
              severity: "error",
              sourceLocation: {
                file: interfacesUri,
                start: 131,
                end: 162,
              },
              type: "DeclarationError",
            };

            beforeEach(async () => {
              ({ connection: mockConnection } = await setupMockLanguageServer({
                projects: { [workspaceFolder]: [projectUri] },
                documents: [{ uri: interfacesUri, analyze: true }],
                errors: [markAsAbstractError],
              }));

              try {
                await waitUntil(
                  () => mockConnection.sendDiagnostics.calledOnce,
                  100,
                  1000
                );
              } catch {
                assert.fail("Send diagnostics not called");
              }
            });

            it("should convert constrain range of mark as abstract error", async () => {
              assert(mockConnection.sendDiagnostics.calledOnce);
              const { uri, diagnostics } =
                mockConnection.sendDiagnostics.firstCall.firstArg;

              assert.equal(uri, interfacesUri);
              assert.deepStrictEqual(diagnostics, [
                {
                  code: "3656",
                  message: 'Contract "Counter" should be marked as abstract.',
                  severity: 1,
                  source: "solidity",
                  range: {
                    start: {
                      line: 7,
                      character: 9,
                    },
                    end: {
                      line: 7,
                      character: 16,
                    },
                  },
                  data: {
                    functionSourceLocation: {
                      start: 131,
                      end: 162,
                    },
                  },
                },
              ]);
            });
          });

          describe("5574 - Contract Size", () => {
            const contractCodeSizeUri = forceToUnixStyle(
              path.join(__dirname, "testData", "ContractCodeSize.sol")
            );

            const contractSizeError: HardhatCompilerError = {
              component: "general",
              errorCode: "5574",
              formattedMessage: "",
              message:
                'Contract code size exceeds 24576 bytes (a limit introduced in Spurious Dragon). This contract may not be deployable on mainnet. Consider enabling the optimizer (with a low "runs" value!), turning off revert strings, or using libraries.',
              severity: "warning",
              sourceLocation: {
                file: contractCodeSizeUri,
                start: 62,
                end: 249,
              },
              type: "DeclarationError",
            };

            beforeEach(async () => {
              ({ connection: mockConnection } = await setupMockLanguageServer({
                projects: { [workspaceFolder]: [projectUri] },
                documents: [{ uri: contractCodeSizeUri, analyze: true }],
                errors: [contractSizeError],
              }));

              try {
                await waitUntil(
                  () => mockConnection.sendDiagnostics.calledOnce,
                  100,
                  1000
                );
              } catch {
                assert.fail("Send diagnostics not called");
              }
            });

            it("should convert constrain range of mark as abstract error", async () => {
              assert(mockConnection.sendDiagnostics.calledOnce);
              const { uri, diagnostics } =
                mockConnection.sendDiagnostics.firstCall.firstArg;

              assert.equal(uri, contractCodeSizeUri);
              assert.deepStrictEqual(diagnostics, [
                {
                  code: "5574",
                  message:
                    'Contract code size exceeds 24576 bytes (a limit introduced in Spurious Dragon). This contract may not be deployable on mainnet. Consider enabling the optimizer (with a low "runs" value!), turning off revert strings, or using libraries.',
                  severity: 2,
                  source: "solidity",
                  range: {
                    start: {
                      line: 3,
                      character: 9,
                    },
                    end: {
                      line: 3,
                      character: 14,
                    },
                  },
                  data: {
                    functionSourceLocation: {
                      start: 62,
                      end: 249,
                    },
                  },
                },
              ]);
            });
          });
        });
      });

      describe("blocking", () => {
        const addOverrideErrorFoo: HardhatCompilerError = {
          component: "general",
          errorCode: "9456",
          formattedMessage: "Error: ...",
          message: 'Overriding function is missing "override" specifier.',
          severity: "error",
          sourceLocation: {
            file: blockedUri,
            start: 248,
            end: 272,
          },
          type: "DeclarationError",
        };

        const addMultioverrideErrorFoo: HardhatCompilerError = {
          component: "general",
          errorCode: "4327",
          formattedMessage: "Error: ...",
          message:
            'Function needs to specify overridden contracts "Alpha" and "Gamma".',
          severity: "error",
          sourceLocation: {
            file: blockedUri,
            start: 248,
            end: 272,
          },
          type: "DeclarationError",
        };

        const addOverrideErrorBar: HardhatCompilerError = {
          component: "general",
          errorCode: "9456",
          formattedMessage: "Error: ...",
          message: 'Overriding function is missing "override" specifier.',
          severity: "error",
          sourceLocation: {
            file: blockedUri,
            start: 276,
            end: 300,
          },
          type: "DeclarationError",
        };

        beforeEach(async () => {
          ({ connection: mockConnection } = await setupMockLanguageServer({
            projects: { [workspaceFolder]: [projectUri] },
            documents: [{ uri: blockedUri, analyze: true }],
            errors: [
              addOverrideErrorFoo,
              addMultioverrideErrorFoo,
              addOverrideErrorBar,
            ],
          }));

          try {
            await waitUntil(
              () => mockConnection.sendDiagnostics.calledOnce,
              100,
              1000
            );
          } catch {
            assert.fail("Send diagnostics not called");
          }
        });

        it("should remove diagnostics blocked by more important diagnostics", async () => {
          assert(mockConnection.sendDiagnostics.calledOnce);
          const { uri, diagnostics } =
            mockConnection.sendDiagnostics.firstCall.firstArg;

          assert.equal(uri, blockedUri);
          assert.deepStrictEqual(diagnostics, [
            // only the multi-override survives on foo
            {
              code: "4327",
              message:
                'Function needs to specify overridden contracts "Alpha" and "Gamma".',
              severity: 1,
              source: "solidity",
              range: {
                start: {
                  line: 14,
                  character: 11,
                },
                end: {
                  line: 14,
                  character: 14,
                },
              },
              data: {
                functionSourceLocation: {
                  start: 248,
                  end: 272,
                },
              },
            },
            // only the single override on bar is unaffected
            {
              code: "9456",
              message: 'Overriding function is missing "override" specifier.',
              severity: 1,
              source: "solidity",
              range: {
                start: {
                  line: 16,
                  character: 11,
                },
                end: {
                  line: 16,
                  character: 14,
                },
              },
              data: {
                functionSourceLocation: {
                  start: 276,
                  end: 300,
                },
              },
            },
          ]);
        });
      });
    });

    describe("validation pass - no solc warnings/errors from worker", () => {
      let sendDiagnostics: sinon.SinonSpy<unknown[], unknown>;
      let sendNotification: sinon.SinonSpy<unknown[], unknown>;

      before(async () => {
        sendDiagnostics = sinon.spy();
        sendNotification = sinon.spy();
        const logger = setupMockLogger();

        const workerReturnMessage: ValidationCompleteMessage = {
          type: "VALIDATION_COMPLETE",
          status: "VALIDATION_PASS",
          jobId: 1,
          version: "0.8.0",
          projectBasePath: "/projects/example",
          sources: ["/projects/example/contracts/first.sol"],
        };

        await validateReturningWorkerMessage(workerReturnMessage, {
          sendDiagnosticsSpy: sendDiagnostics,
          sendNotificationSpy: sendNotification,
          mockLogger: logger,
        });
      });

      it("should clear diagnostics", async () => {
        assert(sendDiagnostics.called);
        assert.deepStrictEqual(sendDiagnostics.args[0][0], {
          diagnostics: [],
          uri: "/projects/example/contracts/first.sol",
        });
      });

      it("should indicate success for the solidity status", () => {
        assert(sendNotification.called);
        assert.equal(
          sendNotification.args[0][0],
          "custom/validation-job-status"
        );
        assert.deepStrictEqual(sendNotification.args[0][1], {
          validationRun: true,
          projectBasePath: "/projects/example",
          version: "0.8.0",
        });
      });
    });

    describe("validation errored - process failed within worker", () => {
      describe("hardhat error", () => {
        describe("import line error", () => {
          let sendDiagnostics: sinon.SinonSpy<unknown[], unknown>;
          let sendNotification: sinon.SinonSpy<unknown[], unknown>;
          let logger: Logger;

          before(async () => {
            sendDiagnostics = sinon.spy();
            sendNotification = sinon.spy();
            logger = setupMockLogger();

            const workerReturnMessage: HardhatThrownError = {
              type: "VALIDATION_COMPLETE",
              status: "HARDHAT_ERROR",
              jobId: 1,
              projectBasePath: "/projects/example",
              hardhatError: {
                name: "HardhatError",
                errorDescriptor: {
                  number: 406,
                  message:
                    "Invalid import %imported% from %from%. Hardhat doesn't support imports via %protocol%.",
                  title:
                    "Invalid import: trying to use an unsupported protocol",
                  description: "A Solidity file is trying to import...",
                  shouldBeReported: false,
                },
                messageArguments: { imported: "./nonexistant.sol" },
              },
            };

            await validateReturningWorkerMessage(workerReturnMessage, {
              sendDiagnosticsSpy: sendDiagnostics,
              sendNotificationSpy: sendNotification,
              mockLogger: logger,
            });
          });

          it("should send the import line diagnostic", async () => {
            assert(sendDiagnostics.called);
            assert.deepStrictEqual(sendDiagnostics.args[0][0], {
              diagnostics: [
                {
                  source: "hardhat",
                  code: 406,
                  severity: 1,
                  message:
                    "Invalid import: trying to use an unsupported protocol",
                  range: {
                    start: {
                      line: 1,
                      character: 9,
                    },
                    end: {
                      line: 1,
                      character: 26,
                    },
                  },
                },
              ],
              uri: "/projects/example/contracts/first.sol",
            });
          });

          it("should indicate failure for the solidity status", () => {
            assert(sendNotification.called);
            assert.equal(
              sendNotification.args[0][0],
              "custom/validation-job-status"
            );

            const expectedFailureStatus: ValidationJobStatusNotification = {
              validationRun: false,
              projectBasePath: "/projects/example",
              reason: "import line hardhat error",
              displayText: "import error",
            };

            assert.deepStrictEqual(
              sendNotification.args[0][1],
              expectedFailureStatus
            );
          });
        });

        describe("non-import line error", () => {
          let sendDiagnostics: sinon.SinonSpy<unknown[], unknown>;
          let sendNotification: sinon.SinonSpy<unknown[], unknown>;
          let logger: Logger;

          before(async () => {
            sendDiagnostics = sinon.spy();
            sendNotification = sinon.spy();
            logger = setupMockLogger();

            const workerReturnMessage: HardhatThrownError = {
              type: "VALIDATION_COMPLETE",
              status: "HARDHAT_ERROR",
              jobId: 1,
              projectBasePath: "/projects/example",
              hardhatError: {
                name: "HardhatError",
                errorDescriptor: {
                  number: 123,
                  message: "This is an example errror",
                  title: "Example error",
                  description: "This is an example error",
                  shouldBeReported: false,
                },
              },
            };

            await validateReturningWorkerMessage(workerReturnMessage, {
              sendDiagnosticsSpy: sendDiagnostics,
              sendNotificationSpy: sendNotification,
              mockLogger: logger,
            });
          });

          it("should clear diagnostics", async () => {
            assert(sendDiagnostics.called);
            assert.deepStrictEqual(sendDiagnostics.args[0][0], {
              diagnostics: [],
              uri: "/projects/example/contracts/first.sol",
            });
          });

          it("should log the error for triage", async () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            assert((logger.error as any).called);
          });

          it("should indicate failure for the solidity status", () => {
            assert(sendNotification.called);
            assert.equal(
              sendNotification.args[0][0],
              "custom/validation-job-status"
            );

            const expectedFailureStatus: ValidationJobStatusNotification = {
              validationRun: false,
              projectBasePath: "/projects/example",
              reason: "non-import line hardhat error",
              displayText: "Example error",
            };

            assert.deepStrictEqual(
              sendNotification.args[0][1],
              expectedFailureStatus
            );
          });
        });
      });

      describe("job completion error", () => {
        describe("directly imports incompatible file", () => {
          it("sends a failure status message", async () =>
            assertJobCompletionError(
              "directly-imports-incompatible-file",
              "directly imports incompatible file"
            ));
        });

        describe("incompatible overriden solc version", () => {
          it("sends a failure status message", async () =>
            assertJobCompletionError(
              "incompatible-overriden-solc-version",
              "incompatible overriden solc version"
            ));
        });

        describe("indirectly imports incompatible file", () => {
          it("sends a failure status message", async () =>
            assertJobCompletionError(
              "indirectly-imports-incompatible-file",
              "indirectly imports incompatible file"
            ));
        });

        describe("no compatibile solc version found", () => {
          it("sends a failure status message", async () =>
            assertJobCompletionError(
              "no-compatible-solc-version-found",
              "no compatibile solc version found"
            ));
        });

        describe("unknown reason", () => {
          it("sends a failure status message", async () =>
            assertJobCompletionError(
              "unknown-failure-reason",
              "unknown failure reason"
            ));
        });
      });

      describe("unknown error", () => {
        describe("node Error", () => {
          let sendDiagnostics: sinon.SinonSpy<unknown[], unknown>;
          let sendNotification: sinon.SinonSpy<unknown[], unknown>;
          let logger: Logger;

          before(async () => {
            sendDiagnostics = sinon.spy();
            sendNotification = sinon.spy();
            logger = setupMockLogger();

            const workerReturnMessage: UnknownError = {
              type: "VALIDATION_COMPLETE",
              status: "UNKNOWN_ERROR",
              jobId: 1,
              projectBasePath: "/projects/example",
              error: { message: "this is unexpected" },
            };

            await validateReturningWorkerMessage(workerReturnMessage, {
              sendDiagnosticsSpy: sendDiagnostics,
              sendNotificationSpy: sendNotification,
              mockLogger: logger,
            });
          });

          it("should clear diagnostics", async () => {
            assert(sendDiagnostics.called);
            assert.deepStrictEqual(sendDiagnostics.args[0][0], {
              diagnostics: [],
              uri: "/projects/example/contracts/first.sol",
            });
          });

          it("should log the error for triage", async () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            assert((logger.error as any).called);
          });

          it("should indicate failure for the solidity status", () => {
            assert(sendNotification.called);
            assert.equal(
              sendNotification.args[0][0],
              "custom/validation-job-status"
            );

            const expectedFailureStatus: ValidationJobStatusNotification = {
              validationRun: false,
              projectBasePath: "/projects/example",
              reason: "unknown",
              displayText: "this is unexpected",
            };

            assert.deepStrictEqual(
              sendNotification.args[0][1],
              expectedFailureStatus
            );
          });
        });

        describe("non-node error", () => {
          let sendDiagnostics: sinon.SinonSpy<unknown[], unknown>;
          let sendNotification: sinon.SinonSpy<unknown[], unknown>;
          let logger: Logger;

          before(async () => {
            sendDiagnostics = sinon.spy();
            sendNotification = sinon.spy();
            logger = setupMockLogger();

            const workerReturnMessage: UnknownError = {
              type: "VALIDATION_COMPLETE",
              status: "UNKNOWN_ERROR",
              jobId: 1,
              projectBasePath: "/projects/example",
              error: "this is just a string",
            };

            await validateReturningWorkerMessage(workerReturnMessage, {
              sendDiagnosticsSpy: sendDiagnostics,
              sendNotificationSpy: sendNotification,
              mockLogger: logger,
            });
          });

          it("should clear diagnostics", async () => {
            assert(sendDiagnostics.called);
            assert.deepStrictEqual(sendDiagnostics.args[0][0], {
              diagnostics: [],
              uri: "/projects/example/contracts/first.sol",
            });
          });

          it("should log the error for triage", async () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            assert((logger.error as any).called);
          });

          it("should indicate failure for the solidity status", () => {
            assert(sendNotification.called);
            assert.equal(
              sendNotification.args[0][0],
              "custom/validation-job-status"
            );

            const expectedFailureStatus: ValidationJobStatusNotification = {
              validationRun: false,
              projectBasePath: "/projects/example",
              reason: "unknown",
              displayText: "internal error",
            };

            assert.deepStrictEqual(
              sendNotification.args[0][1],
              expectedFailureStatus
            );
          });
        });
      });

      describe("cancelled", () => {
        let sendDiagnostics: sinon.SinonSpy<unknown[], unknown>;
        let sendNotification: sinon.SinonSpy<unknown[], unknown>;
        let logger: Logger;

        before(async () => {
          sendDiagnostics = sinon.spy();
          sendNotification = sinon.spy();
          logger = setupMockLogger();

          const workerReturnMessage: CancelledValidation = {
            type: "VALIDATION_COMPLETE",
            status: "CANCELLED",
            jobId: 1,
            projectBasePath: "/projects/example",
          };

          await validateReturningWorkerMessage(workerReturnMessage, {
            sendDiagnosticsSpy: sendDiagnostics,
            sendNotificationSpy: sendNotification,
            mockLogger: logger,
          });
        });

        it("should leave diagnostics to a subsequent validation", async () => {
          assert(sendDiagnostics.notCalled);
        });

        it("should only log for trace purposes", async () => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          assert((logger.trace as any).called);
        });

        it("should leave the solidity status to a subsequent validation", () => {
          assert(sendNotification.notCalled);
        });
      });

      describe("unrecognized message", () => {
        let sendDiagnostics: sinon.SinonSpy<unknown[], unknown>;
        let sendNotification: sinon.SinonSpy<unknown[], unknown>;
        let logger: Logger;

        it("should error as this is a coding issue", async () => {
          sendDiagnostics = sinon.spy();
          sendNotification = sinon.spy();
          logger = setupMockLogger();

          const workerReturnMessage = {
            type: "VALIDATION_COMPLETE",
            status: "MADE UP!!!",
            jobId: 1,
            projectBasePath: "/projects/example",
          };

          try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await validateReturningWorkerMessage(workerReturnMessage as any, {
              sendDiagnosticsSpy: sendDiagnostics,
              sendNotificationSpy: sendNotification,
              mockLogger: logger,
            });
          } catch (err: unknown) {
            if (!isError(err)) {
              assert.fail("Should be Error");
            }

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            assert.equal(
              err.message,
              "Unrecognized message status: MADE UP!!!"
            );
          }
        });
      });
    });

    describe("bad server state", () => {
      describe("no sol file entry", () => {
        it("should log and ignore the validation message", async () => {
          const mockLogger = setupMockLogger();

          const serverState = {
            solFileIndex: {},
            telemetry: fakeTelemetry,
            logger: mockLogger,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } as any;

          const document = TextDocument.create(
            "/projects/example/contracts/first.sol",
            "solidity",
            0,
            '//ignore\n import("./nonexistant.sol")'
          );

          await validate(serverState, { document });

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const logError: any = mockLogger.error;
          assert(logError.called);

          const calledWithError = logError.args[0][0];
          if (!isError(calledWithError)) {
            assert.fail("Should be an error");
          }

          assert.equal(
            calledWithError.message,
            "Could not send to valiation process, uri is not indexed: /projects/example/contracts/first.sol"
          );
        });
      });

      describe("no worker process for project", () => {
        it("should log and ignore the validation message", async () => {
          const mockLogger = setupMockLogger();

          const serverState = {
            solFileIndex: {
              "/projects/example/contracts/first.sol": {
                uri: "/projects/example/contracts/first.sol",
                text: "",
                project: { type: "hardhat", basePath: "/projects/example" },
              },
            },
            workerProcesses: {
              "/projects/example": undefined,
            },
            logger: mockLogger,
            telemetry: fakeTelemetry,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } as any;

          const document = TextDocument.create(
            "/projects/example/contracts/first.sol",
            "solidity",
            0,
            '//ignore\n import("./nonexistant.sol")'
          );

          await validate(serverState, { document });

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const logError: any = mockLogger.error;
          assert(logError.called);

          const calledWithError = logError.args[0][0];
          if (!isError(calledWithError)) {
            assert.fail("Should be an error");
          }

          assert.equal(
            calledWithError.message,
            "No worker process for project: /projects/example"
          );
        });
      });
    });
  });
});

function isError(err: unknown): err is Error {
  return err instanceof Error;
}

async function validateReturningWorkerMessage(
  workerReturnMessage: ValidationCompleteMessage,
  {
    sendDiagnosticsSpy,
    sendNotificationSpy,
    mockLogger,
  }: {
    sendDiagnosticsSpy: sinon.SinonSpy<unknown[], unknown>;
    sendNotificationSpy: sinon.SinonSpy<unknown[], unknown>;
    mockLogger: Logger;
  }
) {
  const serverState = {
    solFileIndex: {
      "/projects/example/contracts/first.sol": {
        uri: "/projects/example/contracts/first.sol",
        text: "",
        tracking: "TRACKED",
        project: { type: "hardhat", basePath: "/projects/example" },
      },
    },
    workerProcesses: {
      "/projects/example": {
        validate: (): ValidationCompleteMessage => workerReturnMessage,
      },
    },
    connection: {
      sendDiagnostics: sendDiagnosticsSpy,
      sendNotification: sendNotificationSpy,
    },
    documents: {
      get: () =>
        TextDocument.create(
          "file:///projects/example/contracts/first.sol",
          "solidity",
          0,
          "// ignore"
        ),
    },
    telemetry: {
      trackTiming: async (_name: string, action: () => Promise<void>) => {
        return action();
      },
    },
    logger: mockLogger,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;

  const document = TextDocument.create(
    "/projects/example/contracts/first.sol",
    "solidity",
    0,
    '//ignore\n import("./nonexistant.sol")'
  );

  await validate(serverState, { document });
}

async function assertJobCompletionError(
  reason: string,
  expectedDisplayText: string
) {
  const sendDiagnostics = sinon.spy();
  const sendNotification = sinon.spy();
  const logger = setupMockLogger();

  const workerReturnMessage: JobCompletionError = {
    type: "VALIDATION_COMPLETE",
    status: "JOB_COMPLETION_ERROR",
    jobId: 1,
    projectBasePath: "/projects/example",
    reason,
  };

  await validateReturningWorkerMessage(workerReturnMessage, {
    sendDiagnosticsSpy: sendDiagnostics,
    sendNotificationSpy: sendNotification,
    mockLogger: logger,
  });

  assert(sendDiagnostics.called);
  assert.deepStrictEqual(sendDiagnostics.args[0][0], {
    diagnostics: [],
    uri: "/projects/example/contracts/first.sol",
  });

  assert(sendNotification.called);
  assert.equal(sendNotification.args[0][0], "custom/validation-job-status");

  const expectedFailureStatus: ValidationJobStatusNotification = {
    validationRun: false,
    projectBasePath: "/projects/example",
    reason,
    displayText: expectedDisplayText,
  };

  assert.deepStrictEqual(sendNotification.args[0][1], expectedFailureStatus);
}
