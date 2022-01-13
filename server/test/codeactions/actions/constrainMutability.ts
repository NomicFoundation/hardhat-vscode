import { assert } from "chai";
import * as fs from "fs";
import * as path from "path";
import { TextDocument } from "vscode-languageserver-textdocument";
import { constrainMutability } from "../../../src/codeactions/actions/constrainMutability";
import { assertCodeAction } from "./assertCodeAction";

describe("Code Actions", () => {
  let constrainMutabilityText: string;

  before(async () => {
    constrainMutabilityText = (
      await fs.promises.readFile(
        path.join(__dirname, "testData", "ConstrainMutability.sol")
      )
    ).toString();
  });

  describe("Constrain Mutability", () => {
    describe("to view", () => {
      it('should provide option to "Add view modifier"', () => {
        const diagnostic = {
          code: "2018",
          message: "Function state mutability can be restricted to view",
          range: {
            start: { line: 10, character: 11 },
            end: { line: 10, character: 21 },
          },
        };

        assertCodeAction(
          constrainMutability,
          constrainMutabilityText,
          diagnostic,
          [
            {
              title: "Add view modifier",
              kind: "quickfix",
              isPreferred: true,
              edits: [
                {
                  newText: "view ",
                  range: {
                    start: {
                      line: 10,
                      character: 32,
                    },
                    end: {
                      line: 10,
                      character: 32,
                    },
                  },
                },
              ],
            },
          ]
        );
      });
    });

    describe("to pure", () => {
      it('should provide option to "Add pure modifier"', () => {
        const diagnostic = {
          code: "2018",
          message: "Function state mutability can be restricted to pure",
          range: {
            start: { line: 14, character: 11 },
            end: { line: 14, character: 18 },
          },
        };

        assertCodeAction(
          constrainMutability,
          constrainMutabilityText,
          diagnostic,
          [
            {
              title: "Add pure modifier",
              kind: "quickfix",
              isPreferred: true,
              edits: [
                {
                  newText: "pure ",
                  range: {
                    start: {
                      line: 14,
                      character: 29,
                    },
                    end: {
                      line: 14,
                      character: 29,
                    },
                  },
                },
              ],
            },
          ]
        );
      });

      it('should provide option to "Change view modifier to pure"', () => {
        const diagnostic = {
          code: "2018",
          message: "Function state mutability can be restricted to pure",
          range: {
            start: { line: 18, character: 11 },
            end: { line: 18, character: 21 },
          },
        };

        assertCodeAction(
          constrainMutability,
          constrainMutabilityText,
          diagnostic,
          [
            {
              title: "Change view modifier to pure",
              kind: "quickfix",
              isPreferred: true,
              edits: [
                {
                  newText: "pure ",
                  range: {
                    start: {
                      line: 18,
                      character: 32,
                    },
                    end: {
                      line: 18,
                      character: 37,
                    },
                  },
                },
              ],
            },
          ]
        );
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

        const document = TextDocument.create(
          exampleUri,
          "solidity",
          0,
          fileText
        );

        const actions = constrainMutability(diagnostic, {
          document,
          uri: exampleUri,
        });

        assert.deepStrictEqual(actions, []);
      });
    });
  });
});
