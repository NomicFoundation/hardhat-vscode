import { assert } from "chai";
import * as path from "path";
import { VSCodePosition } from "@common/types";
import {
  OnReferences,
  setupMockLanguageServer,
} from "../../../helpers/setupMockLanguageServer";
import { Location } from "vscode-languageserver/node";

describe("Parser", () => {
  describe("Navigation", () => {
    describe("References", () => {
      const basicUri = path.join(__dirname, "testData", "References.sol");
      let references: OnReferences;

      before(async () => {
        ({
          server: { references },
        } = await setupMockLanguageServer({
          documents: [{ uri: basicUri, analyze: true }],
          errors: [],
        }));
      });

      it("should navigate to the attribute", () =>
        assertReferencesNavigation(
          references,
          basicUri,
          { line: 23, character: 12 },
          [
            {
              uri: basicUri,
              range: {
                start: { line: 23, character: 11 },
                end: { line: 23, character: 23 },
              },
            },
            {
              uri: basicUri,
              range: {
                start: { line: 30, character: 4 },
                end: { line: 30, character: 16 },
              },
            },
          ]
        ));
    });
  });
});

const assertReferencesNavigation = async (
  references: OnReferences,
  uri: string,
  position: VSCodePosition,
  expectedPositions: Location[]
) => {
  const response = await references({
    context: {
      includeDeclaration: false,
    },
    textDocument: { uri },
    position,
  });

  if (!response || !Array.isArray(response)) {
    assert.fail();
  }

  assert.exists(response);

  assert.deepStrictEqual(response, expectedPositions);
};
