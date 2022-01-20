import { assert } from "chai";
import * as fs from "fs";
import * as path from "path";
import { TextDocument } from "vscode-languageserver-textdocument";
import { assertCodeAction } from "./asserts/assertCodeAction";
import { MarkContractAbstract } from "@compilerDiagnostics/diagnostics/MarkContractAbstract";

describe("Code Actions", () => {
  describe("Mark Contract Abstract", () => {
    const markContractAbstract = new MarkContractAbstract();
    let markContractAbstractText: string;

    before(async () => {
      markContractAbstractText = (
        await fs.promises.readFile(
          path.join(__dirname, "testData", "MarkContractAbstract.sol")
        )
      ).toString();
    });

    it("should provide code action to add abstract keyword", () => {
      const diagnostic = {
        code: "3656",
        message: 'Contract "Counter" should be marked as abstract.',
        range: {
          start: { line: 7, character: 9 },
          end: { line: 7, character: 16 },
        },
        data: {
          functionSourceLocation: { start: 131, end: 162 },
        },
      };

      assertCodeAction(
        markContractAbstract,
        markContractAbstractText,
        diagnostic,
        [
          {
            title: "Add abstract to contract declaration",
            kind: "quickfix",
            isPreferred: true,
            edits: [
              {
                newText: "abstract ",
                range: {
                  start: {
                    line: 7,
                    character: 0,
                  },
                  end: {
                    line: 7,
                    character: 0,
                  },
                },
              },
            ],
          },
        ]
      );
    });

    it("should provide no action if it cannot parse the contract", () => {
      const fileText = `  
      xcontract bad {`;

      const diagnostic = {
        code: "3656",
        message: 'Contract "weird" should be marked as abstract.',
        range: {
          start: { line: 1, character: 6 },
          end: { line: 1, character: 30 },
        },
        data: {
          functionSourceLocation: { start: 9, end: 32 },
        },
      };

      const exampleUri = "/example";

      const document = TextDocument.create(exampleUri, "solidity", 0, fileText);

      const actions = markContractAbstract.resolveActions(diagnostic, {
        document,
        uri: exampleUri,
      });

      assert.deepStrictEqual(actions, []);
    });
  });
});
