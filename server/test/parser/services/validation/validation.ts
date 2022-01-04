import { assert } from "chai";
import * as path from "path";
import { setupMockConnection } from "../../../helpers/setupMockConnection";
import { setupMockLanguageServer } from "../../../helpers/setupMockLanguageServer";

describe("Parser", () => {
  describe("Validation", function () {
    this.timeout(40000);
    const basicUri = path.join(__dirname, "testData", "Basic.sol");
    let mockConnection: ReturnType<typeof setupMockConnection>;
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
        documents: [basicUri],
        errors: [exampleError],
      }));

      // Hack, the anaylsing of text docs is debounced
      await new Promise((resolve) => {
        setTimeout(resolve, 1000);
      });
    });

    it("should pick up compile errors", async () => {
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
});
