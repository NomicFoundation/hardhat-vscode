import * as path from "path";
import { assert } from "chai";
import { VSCodePosition } from "@common/types";
import {
  setupMockLanguageServer,
  OnSignatureHelp,
} from "../../helpers/setupMockLanguageServer";
import { forceToUnixStyle } from "../../helpers/forceToUnixStyle";

describe("Parser", () => {
  describe("Signature Help", () => {
    const signatureHelpUri = forceToUnixStyle(
      path.join(__dirname, "testData", "SignatureHelp.sol")
    );

    let signatureHelp: OnSignatureHelp;

    before(async () => {
      const {
        server: { signatureHelp: sh },
      } = await setupMockLanguageServer({
        documents: [{ uri: signatureHelpUri, analyze: true }],
        errors: [],
      });

      await new Promise((resolve) => setTimeout(resolve, 500));

      signatureHelp = sh;
    });

    async function assertSignatureHelp(
      position: VSCodePosition,
      expectedLabel: string,
      expectedParamCount: number,
      expectedActiveParam: number
    ): Promise<void> {
      const response = await signatureHelp({
        textDocument: { uri: signatureHelpUri },
        position,
        context: {
          triggerKind: 1,
          isRetrigger: false,
        },
      });

      if (!response) {
        assert.fail("Expected signature help response but got null/undefined");
      }

      assert.isArray(response.signatures);
      assert.isAtLeast(response.signatures.length, 1);
      assert.include(response.signatures[0].label, expectedLabel);

      assert.equal(
        response.signatures[0].parameters?.length ?? 0,
        expectedParamCount
      );
      assert.equal(response.activeParameter, expectedActiveParam);
    }

    it("should show signature for a two-parameter function call", () =>
      // Line 24 (0-indexed 23): "        return twoParams(a, b);"
      // '(' at char 24, cursor at 25 (after '(')
      assertSignatureHelp({ line: 23, character: 25 }, "twoParams", 2, 0));

    it("should show correct active parameter for second argument", () =>
      // Line 24 (0-indexed 23): "        return twoParams(a, b);"
      // ',' at char 26, cursor at 28 (on 'b')
      assertSignatureHelp({ line: 23, character: 28 }, "twoParams", 2, 1));

    it("should show signature for a one-parameter function call", () =>
      // Line 28 (0-indexed 27): "        return oneParam(val);"
      // '(' at char 23, cursor at 24
      assertSignatureHelp({ line: 27, character: 24 }, "oneParam", 1, 0));

    it("should show signature for a no-parameter function call", () =>
      // Line 32 (0-indexed 31): "        return noParams();"
      // '(' at char 23, cursor at 24
      assertSignatureHelp({ line: 31, character: 24 }, "noParams", 0, 0));

    it("should show event signature in emit statement", () =>
      // Line 36 (0-indexed 35): "        emit Transfer(msg.sender, address(0), 100);"
      // '(' at char 21, cursor at 22
      assertSignatureHelp({ line: 35, character: 22 }, "Transfer", 3, 0));

    it("should return undefined outside of function call context", async () => {
      // Line 8 (0-indexed 7): "    function noParams() public pure returns (uint256) {"
      // cursor at char 4 ('f' of 'function') - scanning back will hit ';' from previous line
      const response = await signatureHelp({
        textDocument: { uri: signatureHelpUri },
        position: { line: 7, character: 4 },
        context: {
          triggerKind: 1,
          isRetrigger: false,
        },
      });

      assert.isNull(response);
    });
  });
});
