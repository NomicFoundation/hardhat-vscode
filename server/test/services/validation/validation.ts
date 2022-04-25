import { assert } from "chai";
import * as path from "path";
import { forceToUnixStyle } from "../../helpers/forceToUnixStyle";
import { setupMockConnection } from "../../helpers/setupMockConnection";
import { setupMockLanguageServer } from "../../helpers/setupMockLanguageServer";
import { waitUntil } from "../../helpers/waitUntil";

describe("Parser", () => {
  describe("Validation", function () {
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

    describe("pass through", () => {
      const exampleError = {
        sourceLocation: {
          file: basicUri,
          start: 5,
          end: 15,
        },
        errorCode: "101",
        severity: "error",
        message: "It went wrong!",
      };

      beforeEach(async () => {
        ({ connection: mockConnection } = await setupMockLanguageServer({
          projects: [projectUri],
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
      describe("function level error/warning", () => {
        const mutabliltyRestrictToViewWarning = {
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
          type: "Warning",
        };

        beforeEach(async () => {
          ({ connection: mockConnection } = await setupMockLanguageServer({
            projects: [projectUri],
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

          const markAsAbstractError = {
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
            type: "Error",
          };

          beforeEach(async () => {
            ({ connection: mockConnection } = await setupMockLanguageServer({
              projects: [projectUri],
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

          const contractSizeError = {
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
            type: "Warning",
          };

          beforeEach(async () => {
            ({ connection: mockConnection } = await setupMockLanguageServer({
              projects: [projectUri],
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
      const addOverrideErrorFoo = {
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
        type: "Error",
      };

      const addMultioverrideErrorFoo = {
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
        type: "Error",
      };

      const addOverrideErrorBar = {
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
        type: "Error",
      };

      beforeEach(async () => {
        ({ connection: mockConnection } = await setupMockLanguageServer({
          projects: [projectUri],
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
});
