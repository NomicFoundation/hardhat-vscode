import * as path from "path";
import { VSCodePosition } from "@common/types";
import { MarkupKind } from "vscode-languageserver/node";
import { setupMockLanguageServer } from "../../helpers/setupMockLanguageServer";
import { forceToUnixStyle } from "../../helpers/forceToUnixStyle";
import { assertOnServerHover } from "./assertOnServerHover";

describe("Parser", () => {
  describe("Hover", () => {
    describe("Identifier", () => {
      const identifierUri = forceToUnixStyle(
        path.join(__dirname, "testData", "Identifier.sol")
      );

      let assertHover: (
        position: VSCodePosition,
        expectedHoverText: string
      ) => Promise<void>;

      before(async () => {
        const {
          server: { hover },
        } = await setupMockLanguageServer({
          documents: [{ uri: identifierUri, analyze: true }],
          errors: [],
        });

        await new Promise((resolve) => setTimeout(resolve, 500));

        assertHover = (position: VSCodePosition, expectedHoverText: string) =>
          assertOnServerHover(hover, identifierUri, position, {
            kind: MarkupKind.Markdown,
            value: ["```solidity", expectedHoverText, "```"].join("\n"),
          });
      });

      describe("Local variable", () => {
        it("should display details for string", () =>
          assertHover(
            { line: 68, character: 20 },
            "string memory localString"
          ));

        it("should display details for a bool", () =>
          assertHover({ line: 69, character: 20 }, "bool localBool"));

        it("should display details for an int", () =>
          assertHover({ line: 70, character: 20 }, "uint256 localInt"));

        it("should display details for an address", () =>
          assertHover({ line: 71, character: 20 }, "address localAddr"));

        it("should display details for a user defined type", () =>
          assertHover({ line: 72, character: 36 }, "UserType localUserType"));

        it("should display details for an enum", () =>
          assertHover({ line: 73, character: 20 }, "Status localEnum"));

        it("should display details for a struct", () =>
          assertHover(
            { line: 74, character: 20 },
            "TodoStruct memory localStruct"
          ));

        describe("Arrays", () => {
          it("should display details for an int array", () =>
            assertHover(
              { line: 76, character: 20 },
              "uint[] memory localIntArray"
            ));

          it("should display details for an enum array", () =>
            assertHover(
              { line: 77, character: 20 },
              "Status[] memory localEnumArray"
            ));

          it("should display details for a user type array", () =>
            assertHover(
              { line: 78, character: 20 },
              "UserType[] memory localUserTypeArray"
            ));

          it("should display details for a struct array", () =>
            assertHover(
              { line: 79, character: 20 },
              "TodoStruct[] memory localStructArray"
            ));
        });
      });

      describe("Parameter", () => {
        it("should display details for string", () =>
          assertHover(
            { line: 106, character: 20 },
            "string calldata paramString"
          ));

        it("should display details for a bool", () =>
          assertHover({ line: 107, character: 20 }, "bool paramBool"));

        it("should display details for an int", () =>
          assertHover({ line: 108, character: 20 }, "uint112 paramInt"));

        it("should display details for an address", () =>
          assertHover({ line: 109, character: 20 }, "address paramAddr"));

        it("should display details for a user defined type", () =>
          assertHover({ line: 110, character: 36 }, "UserType paramUserType"));

        it("should display details for an enum", () =>
          assertHover({ line: 111, character: 20 }, "Status paramEnum"));

        it("should display details for a struct", () =>
          assertHover(
            { line: 112, character: 20 },
            "TodoStruct memory paramStruct"
          ));

        describe("Arrays", () => {
          it("should display details for an int array", () =>
            assertHover(
              { line: 114, character: 20 },
              "uint144[] storage paramIntArray"
            ));

          it("should display details for an enum array", () =>
            assertHover(
              { line: 115, character: 20 },
              "Status[] memory paramEnumArray"
            ));

          it("should display details for a user type array", () =>
            assertHover(
              { line: 116, character: 20 },
              "UserType[] calldata paramUserTypeArray"
            ));

          it("should display details for a struct array", () =>
            assertHover(
              { line: 117, character: 20 },
              "TodoStruct[] storage paramStructArray"
            ));
        });

        describe("Mappings", () => {
          it("should display details for a simple mapping", () =>
            assertHover(
              { line: 119, character: 20 },
              "mapping(address => uint) storage paramSimpleMapping"
            ));

          it("should display details for a simple mapping", () =>
            assertHover(
              { line: 120, character: 36 },
              "mapping(UserType => UserType) storage paramUserTypeMapping"
            ));

          it("should display details for a nested array mapping", () =>
            assertHover(
              { line: 121, character: 20 },
              "mapping(address => string[]) storage paramNestedArrayMapping"
            ));

          it("should display details for a nested map mapping", () =>
            assertHover(
              { line: 122, character: 20 },
              "mapping(address => mapping(address => uint)) storage paramNestedMapMapping"
            ));
        });
      });

      describe("State Variable", () => {
        it("should display details for string", () =>
          assertHover(
            { line: 129, character: 20 },
            "string internal stateString"
          ));

        it("should display details for a bool", () =>
          assertHover({ line: 130, character: 20 }, "bool private stateBool"));

        it("should display details for an int", () =>
          assertHover({ line: 131, character: 20 }, "uint public stateInt"));

        it("should display details for an address", () =>
          assertHover(
            { line: 132, character: 20 },
            "address public stateAddr"
          ));

        it("should display details for a user defined type", () =>
          assertHover(
            { line: 133, character: 36 },
            "UserType public stateUserType"
          ));

        it("should display details for an enum", () =>
          assertHover(
            { line: 134, character: 20 },
            "Status internal stateEnum"
          ));

        it("should display details for a struct", () =>
          assertHover({ line: 135, character: 20 }, "TodoStruct stateStruct"));

        describe("Arrays", () => {
          it("should display details for an int array", () =>
            assertHover(
              { line: 137, character: 20 },
              "uint256[] public stateIntArray"
            ));

          it("should display details for an enum array", () =>
            assertHover(
              { line: 138, character: 20 },
              "Status[] public stateEnumArray"
            ));

          it("should display details for a user type array", () =>
            assertHover(
              { line: 139, character: 20 },
              "UserType[] public stateUserTypeArray"
            ));

          it("should display details for a struct array", () =>
            assertHover(
              { line: 140, character: 20 },
              "TodoStruct[] public stateStructArray"
            ));
        });

        describe("Mappings", () => {
          it("should display details for a simple mapping", () =>
            assertHover(
              { line: 142, character: 20 },
              "mapping(address => uint) stateSimpleMapping"
            ));

          it("should display details for a simple mapping", () =>
            assertHover(
              { line: 143, character: 36 },
              "mapping(UserType => UserType) stateUserTypeMapping"
            ));

          it("should display details for a nested array mapping", () =>
            assertHover(
              { line: 144, character: 20 },
              "mapping(address => string[]) stateNestedArrayMapping"
            ));

          it("should display details for a nested map mapping", () =>
            assertHover(
              { line: 145, character: 20 },
              "mapping(address => mapping(address => uint)) stateNestedMapMapping"
            ));
        });
      });
    });
  });
});
