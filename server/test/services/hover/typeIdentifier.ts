import * as path from "path";
import { VSCodePosition } from "@common/types";
import { MarkupKind } from "vscode-languageserver/node";
import { setupMockLanguageServer } from "../../helpers/setupMockLanguageServer";
import { forceToUnixStyle } from "../../helpers/forceToUnixStyle";
import { assertOnServerHover } from "./assertOnServerHover";

describe("Parser", () => {
  describe("Hover", () => {
    describe("Type Identifier", () => {
      const typeIdentifierUri = forceToUnixStyle(
        path.join(__dirname, "testData", "TypeIdentifier.sol")
      );

      let assertHover: (
        position: VSCodePosition,
        expectedHoverText: string
      ) => Promise<void>;

      before(async () => {
        const {
          server: { hover },
        } = await setupMockLanguageServer({
          documents: [{ uri: typeIdentifierUri, analyze: true }],
          errors: [],
        });

        await new Promise((resolve) => setTimeout(resolve, 500));

        assertHover = (position: VSCodePosition, expectedHoverText: string) =>
          assertOnServerHover(hover, typeIdentifierUri, position, {
            kind: MarkupKind.Markdown,
            value: ["```solidity", expectedHoverText, "```"].join("\n"),
          });
      });

      describe("Struct Type", () => {
        it("should display struct definition when hovering over struct type name in variable declaration", () =>
          assertHover(
            { line: 19, character: 4 },
            "struct ComplexData {\n    UserInfo info;\n    mapping(uint256 => bool) flags;\n    uint256[] scores;\n}"
          ));

        it("should display struct definition when hovering over struct type name in parameter", () =>
          assertHover(
            { line: 21, character: 27 },
            "struct ComplexData {\n    UserInfo info;\n    mapping(uint256 => bool) flags;\n    uint256[] scores;\n}"
          ));
      });

      describe("Enum Type", () => {
        it("should display enum definition when hovering over enum type name", () =>
          assertHover(
            { line: 30, character: 4 },
            "enum Status { Pending, Active, Completed }"
          ));
      });

      describe("Contract Type", () => {
        it("should display contract definition when hovering over contract type name", () =>
          assertHover({ line: 32, character: 4 }, "contract BaseContract"));
      });

      describe("Nested Struct Type", () => {
        it("should display nested struct definition when hovering over nested struct type name", () =>
          assertHover(
            { line: 14, character: 8 },
            "struct UserInfo {\n    address addr;\n    string name;\n}"
          ));
      });
    });
  });
});
