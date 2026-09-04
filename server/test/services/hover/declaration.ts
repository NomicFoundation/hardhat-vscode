import { assert } from "chai";
import * as path from "path";
import { VSCodePosition } from "@common/types";
import { MarkupKind } from "vscode-languageserver/node";
import {
  OnHover,
  setupMockLanguageServer,
} from "../../helpers/setupMockLanguageServer";
import { forceToUnixStyle } from "../../helpers/forceToUnixStyle";
import { assertOnServerHover } from "./assertOnServerHover";

describe("Parser", () => {
  describe("Hover", () => {
    describe("Declaration", () => {
      const declarationUri = forceToUnixStyle(
        path.join(__dirname, "testData", "Declaration.sol")
      );

      let hover: OnHover;
      let assertHover: (
        position: VSCodePosition,
        expectedHoverText: string
      ) => Promise<void>;

      before(async () => {
        ({
          server: { hover },
        } = await setupMockLanguageServer({
          documents: [{ uri: declarationUri, analyze: true }],
          errors: [],
        }));

        await new Promise((resolve) => setTimeout(resolve, 500));

        assertHover = (position: VSCodePosition, expectedHoverText: string) =>
          assertOnServerHover(hover, declarationUri, position, {
            kind: MarkupKind.Markdown,
            value: ["```solidity", expectedHoverText, "```"].join("\n"),
          });
      });

      describe("Types", () => {
        it("should display details for a contract", () =>
          assertHover({ line: 3, character: 10 }, "contract Ledger"));

        it("should display details for an enum", () =>
          assertHover(
            { line: 4, character: 10 },
            "enum Status { Pending, Settled }"
          ));

        it("should display details for a struct", () =>
          assertHover(
            { line: 9, character: 12 },
            "struct Entry {\n    string label;\n    Status status;\n}"
          ));

        it("should display details for an event", () =>
          assertHover(
            { line: 14, character: 11 },
            "event Recorded(address indexed who, uint256 amount)"
          ));

        it("should display details for an error", () =>
          assertHover(
            { line: 16, character: 11 },
            "error Rejected(string reason)"
          ));
      });

      describe("Variables", () => {
        it("should display details for a state variable", () =>
          assertHover({ line: 18, character: 20 }, "uint256 public total"));

        it("should display details for a state mapping", () =>
          assertHover(
            { line: 19, character: 40 },
            "mapping(address => Entry) internal entries"
          ));

        it("should display details for a local variable", () =>
          assertHover({ line: 26, character: 22 }, "Entry memory entry"));
      });

      describe("Functions", () => {
        it("should display details for a function", () =>
          assertHover(
            { line: 25, character: 14 },
            "function record(address who, uint256 amount) public returns (bool ok)"
          ));

        it("should display details for a parameter", () =>
          assertHover({ line: 25, character: 29 }, "address who"));

        it("should display details for a return parameter", () =>
          assertHover({ line: 25, character: 71 }, "bool ok"));
      });

      describe("Constructors", () => {
        it("should display details for a constructor", () =>
          assertHover(
            { line: 21, character: 5 },
            "constructor(uint256 initialTotal)"
          ));

        it("should display details for a constructor parameter", () =>
          assertHover({ line: 21, character: 25 }, "uint256 initialTotal"));

        // The parent constructor's arguments are kept. The AST renderer this
        // replaces dropped them, in common with every other modifier
        // invocation - see the deleted modifierInvocationToText.
        it("should display details for a constructor invoking its parent", () =>
          assertHover({ line: 35, character: 5 }, "constructor() Ledger(0)"));

        it("should display the constructor at a `new` call site", () =>
          assertHover(
            { line: 48, character: 13 },
            "constructor(uint256 initialTotal)"
          ));

        it("should display the contract at a `new` call site when there is no constructor", () =>
          assertHover({ line: 49, character: 13 }, "contract Empty"));
      });

      describe("Unnamed functions", () => {
        // Fallback and receive functions carry no name, so they have no
        // nameLoc for the searcher to match a position against. Resolving them
        // would need a range-based lookup, not a search by name.
        it("should not offer a hover for a fallback function", () =>
          assertNoHover(hover, declarationUri, { line: 39, character: 5 }));

        it("should not offer a hover for a receive function", () =>
          assertNoHover(hover, declarationUri, { line: 41, character: 5 }));
      });
    });
  });
});

async function assertNoHover(
  hover: OnHover,
  uri: string,
  position: VSCodePosition
): Promise<void> {
  const response = await hover({ textDocument: { uri }, position });

  assert.isNull(response);
}
