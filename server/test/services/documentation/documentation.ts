import { assert } from "chai";
import * as path from "path";
import { SignatureHelp } from "vscode-languageserver/node";
import { forceToUnixStyle } from "../../helpers/forceToUnixStyle";
import {
  setupMockLanguageServer,
  OnSignatureHelp,
} from "../../helpers/setupMockLanguageServer";

describe("Parser", () => {
  describe("Documentation", () => {
    const basicUri = forceToUnixStyle(
      path.join(__dirname, "testData", "Basic.sol")
    );
    let signatureHelp: OnSignatureHelp;

    beforeEach(async () => {
      ({
        server: { signatureHelp },
      } = await setupMockLanguageServer({
        documents: [{ uri: basicUri, analyze: true }],
        errors: [],
      }));
    });

    it("should return signature info", async () => {
      const response = (await signatureHelp({
        textDocument: { uri: basicUri },
        position: { line: 21, character: 21 },
        context: { triggerKind: 2, triggerCharacter: "(", isRetrigger: false },
      })) as SignatureHelp;

      assert.exists(response);
      assert.deepStrictEqual(response.signatures, [
        {
          documentation: "Reset the contract balance.",
          label:
            "function resetBalance(uint120 value, address newOwner) public ",
          parameters: [
            {
              label: [22, 35],
            },
            {
              label: [36, 53],
            },
          ],
        },
      ]);
    });
  });
});
