import * as path from "path";
import { VSCodePosition } from "@common/types";
import { MarkupKind } from "vscode-languageserver/node";
import { setupMockLanguageServer } from "../../helpers/setupMockLanguageServer";
import { forceToUnixStyle } from "../../helpers/forceToUnixStyle";
import { assertOnServerHover } from "./assertOnServerHover";

describe("Parser", () => {
  describe("Hover", () => {
    describe("Function", () => {
      const functionUri = forceToUnixStyle(
        path.join(__dirname, "testData", "Function.sol")
      );

      let assertHover: (
        position: VSCodePosition,
        expectedHoverText: string
      ) => Promise<void>;

      before(async () => {
        const {
          server: { hover },
        } = await setupMockLanguageServer({
          documents: [{ uri: functionUri, analyze: true }],
          errors: [],
        });

        await new Promise((resolve) => setTimeout(resolve, 500));

        assertHover = (position: VSCodePosition, expectedHoverText: string) =>
          assertOnServerHover(hover, functionUri, position, {
            kind: MarkupKind.Markdown,
            value: ["```solidity", expectedHoverText, "```"].join("\n"),
          });
      });

      it("should display details for a minimal function", () =>
        assertHover({ line: 113, character: 13 }, "function minimal() public"));

      it("should display details for a function with returns", () =>
        assertHover(
          { line: 114, character: 13 },
          "function withReturn() public view returns (string memory output)"
        ));

      it("should display details for a function with a parameter list", () =>
        assertHover(
          { line: 116, character: 13 },
          "function withBasicParams(string calldata paramString, bool paramBool, uint112 paramInt, address paramAddr, UserType paramUserType, Status paramEnum, TodoStruct memory paramStruct) public view"
        ));

      it("should display details for a function with a parameter list with arrays", () =>
        assertHover(
          { line: 126, character: 13 },
          "function withArrayParams(uint256[] memory paramIntArray, Status[] calldata paramEnumArray, UserType[] memory paramUserTypeArray, TodoStruct[] calldata paramStructArray) public view returns (string memory output)"
        ));

      it("should display details for a function pulled from a parent contract", () =>
        assertHover(
          { line: 133, character: 13 },
          "function fromBase() public view virtual override onlyExample validAddress returns (uint112 first, uint112 second)"
        ));
    });
  });
});
