import { DiagnosticConverter } from "@services/validation/DiagnosticConverter";
import { assert } from "chai";
import { TextDocument } from "vscode-languageserver-textdocument";
import { setupMockLogger } from "../../helpers/setupMockLogger";

describe("diagnostic converter", () => {
  describe("malformed input error", () => {
    it("should be ignored", () => {
      const mockLogger = setupMockLogger();
      const converter = new DiagnosticConverter(mockLogger);

      const textDocument = TextDocument.create(
        "/example.sol",
        "solidity",
        0,
        "// ignore"
      );

      const results = converter.convertErrors(textDocument, [
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { bad: true } as any,
      ]);

      assert.deepStrictEqual(results, {});
    });
  });
});
