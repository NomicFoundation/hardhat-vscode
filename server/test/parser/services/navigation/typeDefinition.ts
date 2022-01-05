import { assert } from "chai";
import * as path from "path";
import { VSCodePosition } from "@common/types";
import {
  OnTypeDefinition,
  setupMockLanguageServer,
} from "../../../helpers/setupMockLanguageServer";

describe("Parser", () => {
  describe("Navigation", () => {
    describe("Type Definition", () => {
      const basicUri = path.join(__dirname, "testData", "Basic.sol");
      let typeDefinition: OnTypeDefinition;

      before(async () => {
        ({
          server: { typeDefinition },
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
        it("should navigate from attribute declaration", () =>
          assertTypeDefinitionNavigation(
            typeDefinition,
            basicUri,
            { line: 13, character: 5 },
            [
              {
                start: { line: 4, character: 9 },
                end: { line: 4, character: 13 },
              },
            ]
          ));

        it("should navigate from mapping definition", () =>
          assertTypeDefinitionNavigation(
            typeDefinition,
            basicUri,
            { line: 15, character: 22 },
            [
              {
                start: { line: 4, character: 9 },
                end: { line: 4, character: 13 },
              },
            ]
          ));

        it("should navigate from type initialization", () =>
          assertTypeDefinitionNavigation(
            typeDefinition,
            basicUri,
            { line: 20, character: 12 },
            [
              {
                start: { line: 4, character: 9 },
                end: { line: 4, character: 13 },
              },
            ]
          ));
      });
    });
  });
});

const assertTypeDefinitionNavigation = async (
  typeDefinition: OnTypeDefinition,
  uri: string,
  position: VSCodePosition,
  expectedRanges: { start: VSCodePosition; end: VSCodePosition }[]
) => {
  const response = await typeDefinition({ textDocument: { uri }, position });

  if (!response || !Array.isArray(response)) {
    assert.fail();
  }

  assert.exists(response);

  assert.deepStrictEqual(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    response.map((elem: any) => elem.range).filter((x) => !!x),
    expectedRanges
  );
};
