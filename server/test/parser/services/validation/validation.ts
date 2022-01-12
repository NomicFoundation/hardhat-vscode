import { assert } from "chai";
import * as path from "path";
import { setupMockConnection } from "../../../helpers/setupMockConnection";
import { setupMockLanguageServer } from "../../../helpers/setupMockLanguageServer";
import { waitUntil } from "../../../helpers/waitUntil";

describe("Parser", () => {
  describe("Validation", function () {
    const basicUri = path.join(__dirname, "testData", "Basic.sol");
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
      // const unusedLocalVariableWarning = {
      //   "component": "general",
      //   "errorCode": "2072",
      //   "formattedMessage": "Warning: Unused local variable.\n  --> contracts/Greeter.sol:15:3:\n   |\n15 | \t\tstring memory example = '';\n   | \t\t^^^^^^^^^^^^^^^^^^^^^\n\n",
      //   "message": "Unused local variable.",
      //   "severity": "warning",
      //   "sourceLocation": {
      //     "end": 345,
      //     "file": "contracts/Greeter.sol",
      //     "start": 324
      //   },
      //   "type": "Warning"
      // }

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
          documents: [{ uri: basicUri, analyze: true }],
          errors: [mutabliltyRestrictToViewWarning],
        }));

        // Hack, the anaylsing of text docs is debounced
        await new Promise((resolve) => {
          setTimeout(resolve, 1000);
        });
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
  });
});
