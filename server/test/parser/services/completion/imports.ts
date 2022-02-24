import { assert } from "chai";
import * as path from "path";
import { VSCodePosition } from "@common/types";
import {
  OnCompletion,
  setupMockLanguageServer,
} from "../../../helpers/setupMockLanguageServer";
import {
  CompletionContext,
  CompletionItem,
  CompletionItemKind,
} from "vscode-languageserver/node";

describe("Parser", () => {
  const importsUri = path.join(__dirname, "testData", "imports", "Imports.sol");
  const importsSubUri = path.join(
    __dirname,
    "testData",
    "imports",
    "sub",
    "SubImport.sol"
  );
  const importsSubSubUri = path.join(
    __dirname,
    "testData",
    "imports",
    "sub",
    "subsub",
    "SubSubImport.sol"
  );

  let completion: OnCompletion;

  describe("Completion", () => {
    describe("Imports", () => {
      it("should ignore strings outside of imports", async () => {
        ({
          server: { completion },
        } = await setupMockLanguageServer({
          documents: [{ uri: importsUri, analyze: true }],
          errors: [],
        }));

        const response = await completion({
          position: { line: 16, character: 12 },
          textDocument: { uri: importsUri },
          context: {
            triggerKind: 2,
            triggerCharacter: '"',
          },
        });

        assert(response === undefined);
      });

      describe("empty (neither relative/direct)", () => {
        before(async () => {
          const openzepplinUri = path.join(
            __dirname,
            "../../../node_modules/@openzeppelin/contracts/token/ERC1155/presets/ERC1155PresetMinterPauser.sol"
          );
          const ensUri = path.join(
            __dirname,
            "../../../node_modules/@ens/contracts/ENS.sol"
          );

          ({
            server: { completion },
          } = await setupMockLanguageServer({
            documents: [
              { uri: importsUri, analyze: true },
              { uri: openzepplinUri, content: "// empty", analyze: true },
              { uri: ensUri, content: "// empty", analyze: true },
            ],
            errors: [],
          }));
        });

        it("should list sol files under a package folder in node_modules", () =>
          assertImportCompletion(
            completion,
            importsUri,
            { line: 3, character: 8 },
            [
              {
                label: "./Second.sol",
                insertText: "./Second.sol",
                kind: CompletionItemKind.File,
              },
              {
                label: "./Third.sol",
                insertText: "./Third.sol",
                kind: CompletionItemKind.File,
              },
              {
                label: "./sub",
                insertText: "./sub",
                kind: CompletionItemKind.Folder,
              },
              {
                label: "@openzeppelin",
                kind: CompletionItemKind.Folder,
              },
              {
                label: "@ens",
                kind: CompletionItemKind.Folder,
              },
            ],
            {
              triggerKind: 2,
              triggerCharacter: "/",
            }
          ));
      });

      describe("relative", () => {
        describe("within a base folder", () => {
          before(async () => {
            ({
              server: { completion },
            } = await setupMockLanguageServer({
              documents: [{ uri: importsUri, analyze: true }],
              errors: [],
            }));
          });

          it('should provide completions from local folder on ""', () =>
            assertImportCompletion(
              completion,
              importsUri,
              { line: 3, character: 8 },
              [
                {
                  label: "./Second.sol",
                  insertText: "./Second.sol",
                  kind: CompletionItemKind.File,
                },
                {
                  label: "./Third.sol",
                  insertText: "./Third.sol",
                  kind: CompletionItemKind.File,
                },
                {
                  label: "./sub",
                  insertText: "./sub",
                  kind: CompletionItemKind.Folder,
                },
              ],
              {
                triggerKind: 2,
                triggerCharacter: '"',
              }
            ));

          it('should provide completions from local folder on "."', () =>
            assertImportCompletion(
              completion,
              importsUri,
              { line: 4, character: 9 },
              [
                {
                  label: "./Second.sol",
                  insertText: "/Second.sol",
                  kind: CompletionItemKind.File,
                },
                {
                  label: "./Third.sol",
                  insertText: "/Third.sol",
                  kind: CompletionItemKind.File,
                },
                {
                  label: "./sub",
                  insertText: "/sub",
                  kind: CompletionItemKind.Folder,
                },
              ],
              {
                triggerKind: 2,
                triggerCharacter: ".",
              }
            ));

          it('should provide completions from local folder on "./"', () =>
            assertImportCompletion(
              completion,
              importsUri,
              { line: 5, character: 10 },
              [
                {
                  label: "./Second.sol",
                  insertText: "Second.sol",
                  kind: CompletionItemKind.File,
                },
                {
                  label: "./Third.sol",
                  insertText: "Third.sol",
                  kind: CompletionItemKind.File,
                },
                {
                  label: "./sub",
                  insertText: "sub",
                  kind: CompletionItemKind.Folder,
                },
              ],
              {
                triggerKind: 2,
                triggerCharacter: "/",
              }
            ));

          it('should provide completions for sub folders e.g. "./sub"', () =>
            assertImportCompletion(
              completion,
              importsUri,
              { line: 6, character: 14 },
              [
                {
                  label: "Fifth.sol",
                  insertText: "Fifth.sol",
                  kind: CompletionItemKind.File,
                },
                {
                  label: "Fourth.sol",
                  insertText: "Fourth.sol",
                  kind: CompletionItemKind.File,
                },
                {
                  label: "SubImport.sol",
                  insertText: "SubImport.sol",
                  kind: CompletionItemKind.File,
                },
                {
                  label: "subsub",
                  insertText: "subsub",
                  kind: CompletionItemKind.Folder,
                },
              ],
              {
                triggerKind: 2,
                triggerCharacter: "/",
              }
            ));

          it('should provide completions for nested sub folders e.g. "./sub/subsub"', () =>
            assertImportCompletion(
              completion,
              importsUri,
              { line: 7, character: 21 },
              [
                {
                  label: "Seventh.sol",
                  insertText: "Seventh.sol",
                  kind: CompletionItemKind.File,
                },
                {
                  label: "Sixth.sol",
                  insertText: "Sixth.sol",
                  kind: CompletionItemKind.File,
                },
                {
                  label: "SubSubImport.sol",
                  insertText: "SubSubImport.sol",
                  kind: CompletionItemKind.File,
                },
              ],
              {
                triggerKind: 2,
                triggerCharacter: "/",
              }
            ));

          it('should ignore "." in nested path segments e.g. "./sub/subsub/."', () =>
            assertImportCompletion(
              completion,
              importsUri,
              { line: 8, character: 22 },
              [],
              {
                triggerKind: 2,
                triggerCharacter: "/",
              }
            ));

          it("should provide completions for partial file names", () =>
            assertImportCompletion(
              completion,
              importsUri,
              { line: 9, character: 13 },
              [
                {
                  label: "Second.sol",
                  kind: CompletionItemKind.File,
                  textEdit: {
                    newText: "Second.sol",
                    range: {
                      start: {
                        line: 9,
                        character: 10,
                      },
                      end: {
                        line: 9,
                        character: 13,
                      },
                    },
                  },
                },
              ],
              {
                triggerKind: 1,
              }
            ));

          it("should provide completions for partial file names that include extension", () =>
            assertImportCompletion(
              completion,
              importsUri,
              { line: 10, character: 19 },
              [
                {
                  label: "Second.sol",
                  kind: CompletionItemKind.File,
                  textEdit: {
                    newText: "Second.sol",
                    range: {
                      start: {
                        line: 10,
                        character: 10,
                      },
                      end: {
                        line: 10,
                        character: 19,
                      },
                    },
                  },
                },
              ],
              {
                triggerKind: 1,
              }
            ));

          it("should provide completions for partial folder names", () =>
            assertImportCompletion(
              completion,
              importsUri,
              { line: 11, character: 19 },
              [
                {
                  label: "subsub",
                  kind: CompletionItemKind.Folder,
                  insertText: "subsub",
                },
              ],
              {
                triggerKind: 1,
              }
            ));
        });

        describe("within a sub folder", () => {
          before(async () => {
            ({
              server: { completion },
            } = await setupMockLanguageServer({
              documents: [{ uri: importsSubUri, analyze: true }],
              errors: [],
            }));
          });

          it('should provide completions from the subfolder on ""', () =>
            assertImportCompletion(
              completion,
              importsSubUri,
              { line: 3, character: 8 },
              [
                {
                  label: "./Fifth.sol",
                  insertText: "./Fifth.sol",
                  kind: CompletionItemKind.File,
                },
                {
                  label: "./Fourth.sol",
                  insertText: "./Fourth.sol",
                  kind: CompletionItemKind.File,
                },
                {
                  label: "./subsub",
                  insertText: "./subsub",
                  kind: CompletionItemKind.Folder,
                },
              ],
              {
                triggerKind: 2,
                triggerCharacter: '"',
              }
            ));

          it('should provide completions from the subfolder on the parent folder e.g. ".."', () =>
            assertImportCompletion(
              completion,
              importsSubUri,
              { line: 4, character: 10 },
              [
                {
                  label: "../Imports.sol",
                  insertText: "/Imports.sol",
                  kind: CompletionItemKind.File,
                },
                {
                  label: "../Second.sol",
                  insertText: "/Second.sol",
                  kind: CompletionItemKind.File,
                },
                {
                  label: "../Third.sol",
                  insertText: "/Third.sol",
                  kind: CompletionItemKind.File,
                },
                {
                  label: "../sub",
                  insertText: "/sub",
                  kind: CompletionItemKind.Folder,
                },
              ],
              {
                triggerKind: 2,
                triggerCharacter: '"',
              }
            ));

          it('should provide completions from the subfolder on the parent folder with slash e.g. "../"', () =>
            assertImportCompletion(
              completion,
              importsSubUri,
              { line: 4, character: 10 },
              [
                {
                  label: "../Imports.sol",
                  insertText: "/Imports.sol",
                  kind: CompletionItemKind.File,
                },
                {
                  label: "../Second.sol",
                  insertText: "/Second.sol",
                  kind: CompletionItemKind.File,
                },
                {
                  label: "../Third.sol",
                  insertText: "/Third.sol",
                  kind: CompletionItemKind.File,
                },
                {
                  label: "../sub",
                  insertText: "/sub",
                  kind: CompletionItemKind.Folder,
                },
              ],
              {
                triggerKind: 2,
                triggerCharacter: '"',
              }
            ));
        });

        describe("within a nested sub folder", () => {
          before(async () => {
            ({
              server: { completion },
            } = await setupMockLanguageServer({
              documents: [{ uri: importsSubSubUri, analyze: true }],
              errors: [],
            }));
          });

          it('should provide completions from the nested subfolder on ""', () =>
            assertImportCompletion(
              completion,
              importsSubSubUri,
              { line: 3, character: 8 },
              [
                {
                  label: "./Seventh.sol",
                  insertText: "./Seventh.sol",
                  kind: CompletionItemKind.File,
                },
                {
                  label: "./Sixth.sol",
                  insertText: "./Sixth.sol",
                  kind: CompletionItemKind.File,
                },
              ],
              {
                triggerKind: 2,
                triggerCharacter: '"',
              }
            ));

          it('should provide completions from the nested subfolder on the grandparent folder e.g. "../.."', () =>
            assertImportCompletion(
              completion,
              importsSubSubUri,
              { line: 4, character: 13 },
              [
                {
                  label: "Imports.sol",
                  insertText: "/Imports.sol",
                  kind: CompletionItemKind.File,
                },
                {
                  label: "Second.sol",
                  insertText: "/Second.sol",
                  kind: CompletionItemKind.File,
                },
                {
                  label: "Third.sol",
                  insertText: "/Third.sol",
                  kind: CompletionItemKind.File,
                },
                {
                  label: "sub",
                  insertText: "/sub",
                  kind: CompletionItemKind.Folder,
                },
              ],
              {
                triggerKind: 2,
                triggerCharacter: ".",
              }
            ));

          it('should provide completions from the nested subfolder on the grandparent folder with a slash e.g. "../../"', () =>
            assertImportCompletion(
              completion,
              importsSubSubUri,
              { line: 5, character: 14 },
              [
                {
                  label: "Imports.sol",
                  insertText: "Imports.sol",
                  kind: CompletionItemKind.File,
                },
                {
                  label: "Second.sol",
                  insertText: "Second.sol",
                  kind: CompletionItemKind.File,
                },
                {
                  label: "Third.sol",
                  insertText: "Third.sol",
                  kind: CompletionItemKind.File,
                },
                {
                  label: "sub",
                  insertText: "sub",
                  kind: CompletionItemKind.Folder,
                },
              ],
              {
                triggerKind: 2,
                triggerCharacter: ".",
              }
            ));
        });
      });

      describe("direct", function () {
        this.timeout(5000);

        before(async () => {
          const openzepplinUri1 = path.join(
            __dirname,
            "../../../node_modules/@openzeppelin/contracts/token/ERC1155/presets/ERC1155PresetMinterPauser.sol"
          );
          const openzepplinUri2 = path.join(
            __dirname,
            "../../../node_modules/@openzeppelin/contracts/token/ERC20/IERC20.sol"
          );

          ({
            server: { completion },
          } = await setupMockLanguageServer({
            documents: [
              { uri: importsUri, analyze: true },
              { uri: openzepplinUri1, content: "// empty", analyze: true },
              { uri: openzepplinUri2, content: "// empty", analyze: true },
            ],
            errors: [],
          }));
        });

        it("should list sol files under a package folder in node_modules", () =>
          assertImportCompletion(
            completion,
            importsUri,
            { line: 12, character: 22 },
            [
              {
                label:
                  "@openzeppelin/contracts/token/ERC1155/presets/ERC1155PresetMinterPauser.sol",
                kind: CompletionItemKind.Module,
                textEdit: {
                  newText:
                    "@openzeppelin/contracts/token/ERC1155/presets/ERC1155PresetMinterPauser.sol",
                  range: {
                    start: {
                      line: 12,
                      character: 8,
                    },
                    end: {
                      line: 12,
                      character: 22,
                    },
                  },
                },
              },
              {
                label: "@openzeppelin/contracts/token/ERC20/IERC20.sol",
                kind: CompletionItemKind.Module,
                textEdit: {
                  newText: "@openzeppelin/contracts/token/ERC20/IERC20.sol",
                  range: {
                    start: {
                      line: 12,
                      character: 8,
                    },
                    end: {
                      line: 12,
                      character: 22,
                    },
                  },
                },
              },
            ],
            {
              triggerKind: 2,
              triggerCharacter: "/",
            }
          ));

        it("should list sol files under a package folder in node_modules when partially complete", () =>
          assertImportCompletion(
            completion,
            importsUri,
            { line: 13, character: 12 },
            [
              {
                label: "@openzeppelin",
                kind: CompletionItemKind.Module,
                textEdit: {
                  newText: "@openzeppelin",
                  range: {
                    start: {
                      line: 13,
                      character: 8,
                    },
                    end: {
                      line: 13,
                      character: 12,
                    },
                  },
                },
              },
            ],
            {
              triggerKind: 1,
            }
          ));

        it("should list sol files under a package subfolder in node_modules", () =>
          assertImportCompletion(
            completion,
            importsUri,
            { line: 14, character: 54 },
            [
              {
                label:
                  "@openzeppelin/contracts/token/ERC1155/presets/ERC1155PresetMinterPauser.sol",
                kind: CompletionItemKind.Module,
                textEdit: {
                  newText:
                    "@openzeppelin/contracts/token/ERC1155/presets/ERC1155PresetMinterPauser.sol",
                  range: {
                    start: {
                      line: 14,
                      character: 8,
                    },
                    end: {
                      line: 14,
                      character: 54,
                    },
                  },
                },
              },
            ],
            {
              triggerKind: 2,
              triggerCharacter: "/",
            }
          ));

        it("should list sol files under a package subfolder in node_modules when partially complete", () =>
          assertImportCompletion(
            completion,
            importsUri,
            { line: 15, character: 49 },
            [
              {
                label:
                  "@openzeppelin/contracts/token/ERC1155/presets/ERC1155PresetMinterPauser.sol",
                kind: CompletionItemKind.Module,
                textEdit: {
                  newText:
                    "@openzeppelin/contracts/token/ERC1155/presets/ERC1155PresetMinterPauser.sol",
                  range: {
                    start: {
                      line: 15,
                      character: 8,
                    },
                    end: {
                      line: 15,
                      character: 49,
                    },
                  },
                },
              },
            ],
            {
              triggerKind: 2,
              triggerCharacter: "/",
            }
          ));
      });
    });
  });
});

const assertImportCompletion = async (
  completion: OnCompletion,
  documentUri: string,
  position: VSCodePosition,
  completions: CompletionItem[],
  context: CompletionContext = {
    triggerKind: 2,
    triggerCharacter: ".",
  }
) => {
  const response = await completion({
    position,
    textDocument: { uri: documentUri },
    context,
  });

  if (!response || Array.isArray(response)) {
    assert.fail();
  }

  assert.equal(response.isIncomplete, false);

  const actual = response.items.sort((left, right) =>
    left.label.localeCompare(right.label)
  );
  const expected = completions
    .map((comp) => ({
      ...comp,
      documentation: "Imports the package",
    }))
    .sort((left, right) => left.label.localeCompare(right.label));

  assert.deepStrictEqual(actual, expected);
};
