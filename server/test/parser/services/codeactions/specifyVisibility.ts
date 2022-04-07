import { assert } from "chai";
import { TextDocument } from "vscode-languageserver-textdocument";
import { SpecifyVisibility } from "@compilerDiagnostics/diagnostics/SpecifyVisibility";
import { assertCodeAction } from "./asserts/assertCodeAction";
import { setupMockLogger } from "../../../helpers/setupMockLogger";
import { ServerState } from "types";

describe("Code Actions", () => {
  describe("Specify Visibility", () => {
    const specifyVisibility = new SpecifyVisibility();

    it("should provide code actions", () => {
      const fileText = `  
      function greet() returns (string memory input) {
        return greeting;
      }`;

      const diagnostic = {
        code: "4937",
        message: 'No visibility specified. Did you intend to add "public"?',
        range: {
          start: { line: 1, character: 6 },
          end: { line: 3, character: 6 },
        },
        data: {
          functionSourceLocation: { start: 9, end: 90 },
        },
      };

      assertCodeAction(specifyVisibility, fileText, diagnostic, [
        {
          title: "Add public visibilty to function declaration",
          kind: "quickfix",
          isPreferred: false,
          edits: [
            {
              newText: " public",
              range: {
                start: {
                  line: 1,
                  character: 22,
                },
                end: {
                  line: 1,
                  character: 22,
                },
              },
            },
          ],
        },
        {
          title: "Add private visibilty to function declaration",
          kind: "quickfix",
          isPreferred: false,
          edits: [
            {
              newText: " private",
              range: {
                start: {
                  line: 1,
                  character: 22,
                },
                end: {
                  line: 1,
                  character: 22,
                },
              },
            },
          ],
        },
      ]);
    });

    it("should provide code actions with poor whitespace before return", () => {
      const fileText = `  
      function greet()returns (string memory input) {
        return greeting;
      }`;

      const diagnostic = {
        code: "4937",
        message: 'No visibility specified. Did you intend to add "public"?',
        range: {
          start: { line: 1, character: 6 },
          end: { line: 3, character: 6 },
        },
        data: {
          functionSourceLocation: { start: 9, end: 90 },
        },
      };

      assertCodeAction(specifyVisibility, fileText, diagnostic, [
        {
          title: "Add public visibilty to function declaration",
          kind: "quickfix",
          isPreferred: false,
          edits: [
            {
              newText: " public ",
              range: {
                start: {
                  line: 1,
                  character: 22,
                },
                end: {
                  line: 1,
                  character: 22,
                },
              },
            },
          ],
        },
        {
          title: "Add private visibilty to function declaration",
          kind: "quickfix",
          isPreferred: false,
          edits: [
            {
              newText: " private ",
              range: {
                start: {
                  line: 1,
                  character: 22,
                },
                end: {
                  line: 1,
                  character: 22,
                },
              },
            },
          ],
        },
      ]);
    });

    it("should provide no action if it cannot parse the function", () => {
      const fileText = `  
      function weird( {}`;

      const diagnostic = {
        code: "4937",
        message: 'No visibility specified. Did you intend to add "public"?',
        range: {
          start: { line: 1, character: 6 },
          end: { line: 1, character: 25 },
        },
        data: {
          functionSourceLocation: { start: 9, end: 27 },
        },
      };

      const exampleUri = "/example";

      const document = TextDocument.create(exampleUri, "solidity", 0, fileText);

      const mockLogger = setupMockLogger();
      const serverState = {
        logger: mockLogger,
      } as ServerState;

      const actions = specifyVisibility.resolveActions(
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
