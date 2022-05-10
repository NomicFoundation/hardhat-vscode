import * as path from "path";
import { VSCodePosition } from "@common/types";
import { MarkupKind } from "vscode-languageserver/node";
import { setupMockLanguageServer } from "../../helpers/setupMockLanguageServer";
import { forceToUnixStyle } from "../../helpers/forceToUnixStyle";
import { assertOnServerHover } from "./assertOnServerHover";

describe("Parser", () => {
  describe("Hover", () => {
    describe("Error", () => {
      const errorUri = forceToUnixStyle(
        path.join(__dirname, "testData", "Error.sol")
      );

      let assertHover: (
        position: VSCodePosition,
        expectedHoverText: string
      ) => Promise<void>;

      before(async () => {
        const {
          server: { hover },
        } = await setupMockLanguageServer({
          documents: [{ uri: errorUri, analyze: true }],
          errors: [],
        });

        await new Promise((resolve) => setTimeout(resolve, 500));

        assertHover = (position: VSCodePosition, expectedHoverText: string) =>
          assertOnServerHover(hover, errorUri, position, {
            kind: MarkupKind.Markdown,
            value: ["```solidity", expectedHoverText, "```"].join("\n"),
          });
      });

      it("should display details for parameterless error", () =>
        assertHover({ line: 40, character: 19 }, "error SimpleError()"));

      it("should display details for an error with parameters", () =>
        assertHover(
          { line: 44, character: 19 },
          "error ArgError(uint first, TodoStruct second, AuctionBase third, Status fourth)"
        ));

      it("should display details for an error inherited from a parent contract", () =>
        assertHover(
          { line: 48, character: 19 },
          "error BaseError(uint first)"
        ));
    });
  });
});
