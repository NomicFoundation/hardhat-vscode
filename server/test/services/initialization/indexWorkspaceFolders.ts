import { resolveTopLevelWorkspaceFolders } from "@services/initialization/resolveTopLevelWorkspaceFolders";
import { assert } from "chai";
import { WorkspaceFolder } from "vscode-languageserver";

describe("initialization", () => {
  describe("indexing workspace folders", () => {
    it("returns new workspace folders", () => {
      const existingFolders: WorkspaceFolder[] = [];
      const addedFolders: WorkspaceFolder[] = [
        {
          name: "example",
          uri: "file///data/example",
        },
      ];

      const resolvedFolders = resolveTopLevelWorkspaceFolders(
        { workspaceFolders: existingFolders },
        addedFolders
      );

      assert.deepStrictEqual(resolvedFolders, addedFolders);
    });

    it("ignores workspace folders that have already been indexed", () => {
      const existingFolders: WorkspaceFolder[] = [
        {
          name: "example",
          uri: "file///data/example",
        },
      ];

      const addedFolders: WorkspaceFolder[] = [
        {
          name: "example",
          uri: "file///data/example",
        },
      ];

      const resolvedFolders = resolveTopLevelWorkspaceFolders(
        { workspaceFolders: existingFolders },
        addedFolders
      );

      assert.deepStrictEqual(resolvedFolders, []);
    });

    it("ignores nested folders when one added folder within another", () => {
      const existingFolders: WorkspaceFolder[] = [];

      const addedFolders: WorkspaceFolder[] = [
        {
          name: "example",
          uri: "file///data/example",
        },
        {
          name: "sub",
          uri: "file///data/example/sub",
        },
      ];

      const resolvedFolders = resolveTopLevelWorkspaceFolders(
        { workspaceFolders: existingFolders },
        addedFolders
      );

      assert.deepStrictEqual(resolvedFolders, [
        {
          name: "example",
          uri: "file///data/example",
        },
      ]);
    });

    it("ignores added folder when added is nested in already existing folder", () => {
      const existingFolders: WorkspaceFolder[] = [
        {
          name: "example",
          uri: "file///data/example",
        },
      ];

      const addedFolders: WorkspaceFolder[] = [
        {
          name: "sub",
          uri: "file///data/example/sub",
        },
      ];

      const resolvedFolders = resolveTopLevelWorkspaceFolders(
        { workspaceFolders: existingFolders },
        addedFolders
      );

      assert.deepStrictEqual(resolvedFolders, []);
    });
  });
});
