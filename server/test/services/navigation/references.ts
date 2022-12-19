import { assert } from "chai";
import * as path from "path";
import { VSCodePosition, VSCodeLocation } from "@common/types";
import {
  OnReferences,
  setupMockLanguageServer,
} from "../../helpers/setupMockLanguageServer";
import { forceToUnixStyle } from "../../helpers/forceToUnixStyle";
import { toUri } from "../../../src/utils";

describe("Parser", () => {
  describe("Navigation", () => {
    describe("References", () => {
      const basicUri = forceToUnixStyle(
        path.join(__dirname, "testData", "References.sol")
      );
      const twoContractUri = forceToUnixStyle(
        path.join(__dirname, "testData", "TwoContracts.sol")
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
                  start: { line: 10, character: 31 },
                  end: { line: 10, character: 38 },
                },
              }
            ));

          it("should show usages of contract invocation (new keyword)", () =>
            assertReferencesNavigation(
              references,
              twoContractUri,
              { line: 29, character: 9 },
              {
                uri: twoContractUri,
                range: {
                  start: { line: 38, character: 8 },
                  end: { line: 38, character: 26 },
                },
              }
            ));
        });

        describe("constructor", () => {
          it("should show usages of itself", () =>
            assertReferencesNavigation(
              references,
              twoContractUri,
              { line: 14, character: 2 },
              {
                uri: twoContractUri,
                range: {
                  start: { line: 14, character: 2 },
                  end: { line: 14, character: 13 },
                },
              }
            ));

          it("should show usages of contract extension", () =>
            assertReferencesNavigation(
              references,
              twoContractUri,
              { line: 14, character: 2 },
              {
                uri: twoContractUri,
                range: {
                  start: { line: 18, character: 31 },
                  end: { line: 18, character: 34 },
                },
              }
            ));

          it("should show usages of contract invocation (new keyword)", () =>
            assertReferencesNavigation(
              references,
              twoContractUri,
              { line: 33, character: 2 },
              {
                uri: twoContractUri,
                range: {
                  start: { line: 42, character: 8 },
                  end: { line: 42, character: 23 },
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
  expectedPositions: VSCodeLocation
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

  assert.deepInclude(response, {
    ...expectedPositions,
    uri: toUri(expectedPositions.uri),
  });
};
