import { assert } from "chai";
import * as path from "path";
import { VSCodePosition } from "@common/types";
import {
  OnDefinition,
  setupMockLanguageServer,
} from "../../../helpers/setupMockLanguageServer";

describe("Parser", () => {
  describe("Navigation", () => {
    describe("Definition", () => {
      const basicUri = path.join(__dirname, "testData", "Basic.sol");
      let definition: OnDefinition;

      before(async () => {
        ({
          server: { definition },
        } = await setupMockLanguageServer({
          documents: [basicUri],
          errors: [],
        }));

        // Hack, the anaylsing of text docs is debounced
        await new Promise((resolve) => {
          setTimeout(resolve, 1000);
        });
      });

      describe("within contract", () => {
        it("should navigate to the attribute", () =>
          assertDefinitionNavigation(
            definition,
            basicUri,
            { line: 19, character: 9 },
            {
              start: { line: 11, character: 17 },
              end: { line: 11, character: 24 },
            }
          ));

        it("should navigate to a nested struct attribute", () =>
          assertDefinitionNavigation(
            definition,
            basicUri,
            { line: 28, character: 14 },
            {
              start: { line: 5, character: 12 },
              end: { line: 5, character: 20 },
            }
          ));

        it("should navigate to local function", () =>
          assertDefinitionNavigation(
            definition,
            basicUri,
            { line: 30, character: 9 },
            {
              start: { line: 23, character: 2 },
              end: { line: 25, character: 2 },
            }
          ));

        it("should navigate to type via map property", () =>
          assertDefinitionNavigation(
            definition,
            basicUri,
            { line: 15, character: 24 },
            {
              start: { line: 4, character: 2 },
              end: { line: 9, character: 1 },
            }
          ));

        it("should navigate to type via array declaration", () =>
          assertDefinitionNavigation(
            definition,
            basicUri,
            { line: 16, character: 5 },
            {
              start: { line: 33, character: 2 },
              end: { line: 35, character: 2 },
            }
          ));
      });
    });
  });
});

const assertDefinitionNavigation = async (
  definition: OnDefinition,
  uri: string,
  position: VSCodePosition,
  expectedRange: { start: VSCodePosition; end: VSCodePosition }
) => {
  const response = await definition({ textDocument: { uri }, position });

  if (!response || Array.isArray(response)) {
    assert.fail();
  }

  assert.exists(response);
  assert.deepStrictEqual(response?.range, expectedRange);
};
