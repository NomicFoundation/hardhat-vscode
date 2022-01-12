import { assert } from "chai";
import { TextDocument } from "vscode-languageserver-textdocument";
import { constrainMutability } from "../../../src/codeactions/actions/constrainMutability";
import { assertCodeAction } from "./assertCodeAction";

describe("Code Actions", () => {
  describe("Constrain Mutability", () => {
    it('should provide option to "Add view modifier"', () => {
      const fileText = `  
      function greet() private returns (string memory input) {
        return greeting;
      }`;

      const diagnostic = {
        code: "2018",
        message: "Function state mutability can be restricted to view",
        range: {
          start: { line: 1, character: 6 },
          end: { line: 3, character: 6 },
        },
      };

      assertCodeAction(constrainMutability, fileText, diagnostic, [
        {
          title: "Add view modifier",
          kind: "quickfix",
          isPreferred: true,
          edits: [
            {
              newText: "view ",
              range: {
                start: {
                  line: 1,
                  character: 31,
                },
                end: {
                  line: 1,
                  character: 31,
                },
              },
            },
          ],
        },
      ]);
    });

    it('should provide option to "Add pure modifier"', () => {
      const fileText = `  
      function greet() private view returns (string memory input) {
        return "just text no private props";
      }`;

      const diagnostic = {
        code: "2018",
        message: "Function state mutability can be restricted to pure",
        range: {
          start: { line: 1, character: 6 },
          end: { line: 3, character: 6 },
        },
      };

      assertCodeAction(constrainMutability, fileText, diagnostic, [
        {
          title: "Add pure modifier",
          kind: "quickfix",
          isPreferred: true,
          edits: [
            {
              newText: "pure ",
              range: {
                start: {
                  line: 1,
                  character: 31,
                },
                end: {
                  line: 1,
                  character: 36,
                },
              },
            },
          ],
        },
      ]);
    });

    it("should provide no action if it cannot parse the function", () => {
      const fileText = `  
      function weird() {}`;

      const diagnostic = {
        code: "2018",
        message: "Function state mutability can be restricted to pure",
        range: {
          start: { line: 1, character: 6 },
          end: { line: 1, character: 25 },
        },
      };

      const exampleUri = "/example";

      const document = TextDocument.create(exampleUri, "solidity", 0, fileText);

      const actions = constrainMutability(diagnostic, {
        document,
        uri: exampleUri,
      });

      assert.deepStrictEqual(actions, []);
    });
  });
});
