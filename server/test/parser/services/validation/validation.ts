import { assert } from "chai";
import * as path from "path";
import { setupMockConnection } from "../../../helpers/setupMockConnection";
import { setupMockLanguageServer } from "../../../helpers/setupMockLanguageServer";
import { waitUntil } from "../../../helpers/waitUntil";

describe("Parser", () => {
  describe("Validation", function () {
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
