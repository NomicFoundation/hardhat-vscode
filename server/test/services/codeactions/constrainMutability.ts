import { assert } from "chai";
import * as fs from "fs";
import * as path from "path";
import { TextDocument } from "vscode-languageserver-textdocument";
import { ConstrainMutability } from "@compilerDiagnostics/diagnostics/ConstrainMutability";
import { setupMockLogger } from "../../helpers/setupMockLogger";
import { ServerState } from "../../../src/types";
import { assertCodeAction } from "./asserts/assertCodeAction";

describe("Code Actions", () => {
  const constrainMutability = new ConstrainMutability();
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
      it('should provide option to "Add view modifier to function declaration"', async () => {
        const diagnostic = {
          code: "2018",
          message: "Function state mutability can be restricted to view",
          range: {
            start: { line: 10, character: 11 },
            end: { line: 10, character: 21 },
          },
          data: {
            functionSourceLocation: {
              start: 179,
              end: 264,
            },
          },
        };

        await assertCodeAction(
          constrainMutability,
          constrainMutabilityText,
          diagnostic,
          [
            {
              title: "Add view modifier to function declaration",
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

      it("should provide view option to functions with modifiers", async () => {
        const diagnostic = {
          code: "2018",
          message: "Function state mutability can be restricted to view",
          range: {
            start: { line: 22, character: 11 },
            end: { line: 22, character: 33 },
          },
          data: {
            functionSourceLocation: {
              start: 446,
              end: 567,
            },
          },
        };

        await assertCodeAction(
          constrainMutability,
          constrainMutabilityText,
          diagnostic,
          [
            {
              title: "Add view modifier to function declaration",
              kind: "quickfix",
              isPreferred: true,
              edits: [
                {
                  newText: "    view\n",
                  range: {
                    start: {
                      line: 24,
                      character: 0,
                    },
                    end: {
                      line: 24,
                      character: 0,
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
      it('should provide option to "Add pure modifier to function declaration"', async () => {
        const diagnostic = {
          code: "2018",
          message: "Function state mutability can be restricted to pure",
          range: {
            start: { line: 14, character: 11 },
            end: { line: 14, character: 18 },
          },
          data: {
            functionSourceLocation: {
              start: 268,
              end: 349,
            },
          },
        };

        await assertCodeAction(
          constrainMutability,
          constrainMutabilityText,
          diagnostic,
          [
            {
              title: "Add pure modifier to function declaration",
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

      it('should provide option to "Change view modifier to pure in function declaration"', async () => {
        const diagnostic = {
          code: "2018",
          message: "Function state mutability can be restricted to pure",
          range: {
            start: { line: 18, character: 11 },
            end: { line: 18, character: 21 },
          },
          data: {
            functionSourceLocation: {
              start: 353,
              end: 442,
            },
          },
        };

        await assertCodeAction(
          constrainMutability,
          constrainMutabilityText,
          diagnostic,
          [
            {
              title: "Change view modifier to pure in function declaration",
              kind: "quickfix",
              isPreferred: true,
              edits: [
                {
                  newText: "pure",
                  range: {
                    start: {
                      line: 18,
                      character: 32,
                    },
                    end: {
                      line: 18,
                      character: 36,
                    },
                  },
                },
              ],
            },
          ]
        );
      });

      it("should provide pure option to functions with modifiers", async () => {
        const diagnostic = {
          code: "2018",
          message: "Function state mutability can be restricted to pure",
          range: {
            start: { line: 30, character: 11 },
            end: { line: 30, character: 30 },
          },
          data: {
            functionSourceLocation: { start: 571, end: 697 },
          },
        };

        await assertCodeAction(
          constrainMutability,
          constrainMutabilityText,
          diagnostic,
          [
            {
              title: "Change view modifier to pure in function declaration",
              kind: "quickfix",
              isPreferred: true,
              edits: [
                {
                  newText: "pure",
                  range: {
                    start: {
                      line: 32,
                      character: 4,
                    },
                    end: {
                      line: 32,
                      character: 8,
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
          data: {
            functionSourceLocation: { start: 0, end: 25 },
          },
        };

        const exampleUri = "/example";

        const document = TextDocument.create(
          exampleUri,
          "solidity",
          0,
          fileText
        );

        const mockLogger = setupMockLogger();

        const serverState = {
          logger: mockLogger,
        } as ServerState;

        const actions = constrainMutability.resolveActions(
          serverState,
          diagnostic,
          {
            document,
            uri: exampleUri,
          }
        );

        assert.deepStrictEqual(actions, []);
      });
    });
  });
});
