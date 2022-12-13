import { assert } from "chai";
import * as path from "path";
import { VSCodePosition, TextEdit } from "@common/types";
import {
  OnRenameRequest,
  setupMockLanguageServer,
} from "../../helpers/setupMockLanguageServer";
import { forceToUnixStyle } from "../../helpers/forceToUnixStyle";
import { toUri } from "../../../src/utils";

describe("Parser", () => {
  describe("Rename", () => {
    describe("Contract", () => {
      const contractRenameUri = forceToUnixStyle(
        path.join(__dirname, "testData", "ContractRename.sol")
      );
      let renameRequest: OnRenameRequest;
      const expectRenameEdits = [
        {
          range: {
            start: { line: 3, character: 9 },
            end: { line: 3, character: 15 },
          },
          newText: "Animal2",
        },
        {
          range: {
            start: { line: 15, character: 16 },
            end: { line: 15, character: 22 },
          },
          newText: "Animal2",
        },
        {
          range: {
            start: { line: 16, character: 18 },
            end: { line: 16, character: 24 },
          },
          newText: "Animal2",
        },
        {
          range: {
            start: { line: 22, character: 17 },
            end: { line: 22, character: 23 },
          },
          newText: "Animal2",
        },
        {
          newText: "Animal2",
          range: {
            start: {
              line: 31,
              character: 17,
            },
            end: {
              line: 31,
              character: 23,
            },
          },
        },
        {
          newText: "Animal2",
          range: {
            start: {
              line: 34,
              character: 21,
            },
            end: {
              line: 34,
              character: 27,
            },
          },
        },
        {
          newText: "Animal2",
          range: {
            end: {
              line: 36,
              character: 27,
            },
            start: {
              line: 36,
              character: 21,
            },
          },
        },
      ];

      beforeEach(async () => {
        ({
          server: { renameRequest },
        } = await setupMockLanguageServer({
          documents: [{ uri: contractRenameUri, analyze: true }],
          errors: [],
        }));
      });

      describe("on contract name", () => {
        it("should update symbols", () =>
          assertRename(
            renameRequest,
            contractRenameUri,
            "Animal2",
            { line: 3, character: 9 },
            expectRenameEdits
          ));
      });

      describe("on extension of contract", () => {
        it("should update symbols", () =>
          assertRename(
            renameRequest,
            contractRenameUri,
            "Animal2",
            { line: 15, character: 16 },
            expectRenameEdits
          ));
      });

      describe("on other contract constructor modifier", () => {
        it("should update symbols", () =>
          assertRename(
            renameRequest,
            contractRenameUri,
            "Animal2",
            { line: 16, character: 18 },
            expectRenameEdits
          ));
      });

      describe("on function override modifier", () => {
        it("should update symbols", () =>
          assertRename(
            renameRequest,
            contractRenameUri,
            "Animal2",
            { line: 22, character: 17 },
            expectRenameEdits
          ));
      });
    });

    describe("Modifiers", () => {
      const modifierRenameUri = forceToUnixStyle(
        path.join(__dirname, "testData", "ModifierRename.sol")
      );
      let renameRequest: OnRenameRequest;
      const expectedModifierEdits = [
        {
          newText: "exampleMod2",
          range: {
            start: {
              line: 10,
              character: 13,
            },
            end: {
              line: 10,
              character: 23,
            },
          },
        },
        {
          newText: "exampleMod2",
          range: {
            start: {
              line: 14,
              character: 46,
            },
            end: {
              line: 14,
              character: 56,
            },
          },
        },
        {
          newText: "exampleMod2",
          range: {
            start: {
              line: 20,
              character: 27,
            },
            end: {
              line: 20,
              character: 37,
            },
          },
        },
        {
          newText: "exampleMod2",
          range: {
            start: {
              line: 30,
              character: 8,
            },
            end: {
              line: 30,
              character: 18,
            },
          },
        },
      ];

      beforeEach(async () => {
        ({
          server: { renameRequest },
        } = await setupMockLanguageServer({
          documents: [{ uri: modifierRenameUri, analyze: true }],
          errors: [],
        }));
      });

      describe("on modifier name", () => {
        it("should update symbols", () =>
          assertRename(
            renameRequest,
            modifierRenameUri,
            "exampleMod2",
            { line: 10, character: 13 },
            expectedModifierEdits
          ));
      });

      describe("on function modifier", () => {
        it("should update symbols", () =>
          assertRename(
            renameRequest,
            modifierRenameUri,
            "exampleMod2",
            { line: 14, character: 46 },
            expectedModifierEdits
          ));
      });

      describe("on constructor modifier", () => {
        it("should update symbols", () =>
          assertRename(
            renameRequest,
            modifierRenameUri,
            "exampleMod2",
            { line: 20, character: 27 },
            expectedModifierEdits
          ));
      });

      describe("on inheriting contract function modifier", () => {
        it("should update symbols", () =>
          assertRename(
            renameRequest,
            modifierRenameUri,
            "exampleMod2",
            { line: 30, character: 8 },
            expectedModifierEdits
          ));
      });
    });
  });
});

const assertRename = async (
  renameRequest: OnRenameRequest,
  uri: string,
  newName: string,
  position: VSCodePosition,
  expectedChanges: TextEdit[]
) => {
  const response = await renameRequest({
    textDocument: { uri },
    position,
    newName,
  });

  if (!response || !response.changes) {
    assert.fail();
  }

  const fileChanges = response.changes[toUri(uri)].sort(
    (left, right) => left.range.start.line - right.range.start.line
  );

  assert.deepStrictEqual(fileChanges, expectedChanges);
};
