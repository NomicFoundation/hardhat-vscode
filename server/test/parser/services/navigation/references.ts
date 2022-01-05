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
      const twoContractUri = path.join(
        __dirname,
        "testData",
        "TwoContracts.sol"
      );
      let references: OnReferences;

      before(async () => {
        ({
          server: { references },
        } = await setupMockLanguageServer({
          documents: [
            { uri: basicUri, analyze: true },
            { uri: twoContractUri, analyze: true },
          ],
          errors: [],
        }));
      });

      describe("functions", () => {
        it("should show usages of function", () =>
          assertReferencesNavigation(
            references,
            basicUri,
            { line: 23, character: 12 },
            {
              uri: basicUri,
              range: {
                start: { line: 30, character: 4 },
                end: { line: 30, character: 16 },
              },
            }
          ));
      });

      describe("contracts", () => {
        describe("definition", () => {
          it("should show usages of contract extension", () =>
            assertReferencesNavigation(
              references,
              twoContractUri,
              { line: 3, character: 10 },
              {
                uri: twoContractUri,
                range: {
                  start: { line: 10, character: 33 },
                  end: { line: 10, character: 40 },
                },
              }
            ));
        });

        describe("constructor", () => {
          it("should show usages of itself", () =>
            assertReferencesNavigation(
              references,
              twoContractUri,
              { line: 14, character: 6 },
              {
                uri: twoContractUri,
                range: {
                  start: { line: 14, character: 4 },
                  end: { line: 14, character: 28 },
                },
              }
            ));

          it("should show usages of contract extension", () =>
            assertReferencesNavigation(
              references,
              twoContractUri,
              { line: 14, character: 6 },
              {
                uri: twoContractUri,
                range: {
                  start: { line: 18, character: 33 },
                  end: { line: 18, character: 36 },
                },
              }
            ));
        });
      });
    });
  });
});

const assertReferencesNavigation = async (
  references: OnReferences,
  uri: string,
  position: VSCodePosition,
  expectedPositions: Location
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

  assert.deepInclude(response, expectedPositions);
};
