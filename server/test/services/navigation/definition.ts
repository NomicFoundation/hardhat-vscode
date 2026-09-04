import { assert } from "chai";
import * as path from "path";
import { VSCodePosition } from "@common/types";
import {
  OnDefinition,
  setupMockLanguageServer,
} from "../../helpers/setupMockLanguageServer";
import { forceToUnixStyle } from "../../helpers/forceToUnixStyle";

describe("Parser", () => {
  describe("Navigation", () => {
    describe("Definition", () => {
      describe("within single file", () => {
        const definitionUri = forceToUnixStyle(
          path.join(__dirname, "testData", "Definition.sol")
        );

        const twoContractUri = forceToUnixStyle(
          path.join(__dirname, "testData", "TwoContracts.sol")
        );

        let definition: OnDefinition;

        describe("within contract", () => {
          before(async () => {
            ({
              server: { definition },
            } = await setupMockLanguageServer({
              documents: [{ uri: definitionUri, analyze: true }],
              errors: [],
            }));

            await new Promise((resolve) => setTimeout(resolve, 500));
          });

          it("should navigate to the attribute", () =>
            assertDefinitionNavigation(
              definition,
              definitionUri,
              { line: 19, character: 2 },
              {
                start: { line: 11, character: 17 },
                end: { line: 11, character: 24 },
              }
            ));

          it("should navigate to a nested struct attribute", () =>
            assertDefinitionNavigation(
              definition,
              definitionUri,
              { line: 28, character: 14 },
              {
                start: { line: 5, character: 12 },
                end: { line: 5, character: 20 },
              }
            ));

          it("should navigate to local function", () =>
            assertDefinitionNavigation(
              definition,
              definitionUri,
              { line: 30, character: 9 },
              {
                start: { line: 23, character: 11 },
                end: { line: 23, character: 23 },
              }
            ));

          it("should navigate to type via map property", () =>
            assertDefinitionNavigation(
              definition,
              definitionUri,
              { line: 15, character: 24 },
              {
                start: { line: 4, character: 9 },
                end: { line: 4, character: 13 },
              }
            ));

          it("should navigate to type via array declaration", () =>
            assertDefinitionNavigation(
              definition,
              definitionUri,
              { line: 16, character: 2 },
              {
                start: { line: 33, character: 9 },
                end: { line: 33, character: 12 },
              }
            ));

          describe("function overloads", () => {
            it("should navigate to function with overloads", () =>
              assertMultiDefinitionNavigation(
                definition,
                definitionUri,
                { line: 70, character: 9 },
                [
                  {
                    start: { line: 39, character: 11 },
                    end: { line: 39, character: 22 },
                  },
                  {
                    start: { line: 43, character: 11 },
                    end: { line: 43, character: 22 },
                  },
                  {
                    start: { line: 51, character: 11 },
                    end: { line: 51, character: 22 },
                  },
                ]
              ));

            it("should distinguish between overloads based on parameter cardinality", () =>
              assertMultiDefinitionNavigation(
                definition,
                definitionUri,
                { line: 71, character: 9 },
                [
                  {
                    start: { line: 39, character: 11 },
                    end: { line: 39, character: 22 },
                  },
                  {
                    start: { line: 43, character: 11 },
                    end: { line: 43, character: 22 },
                  },
                  {
                    start: { line: 51, character: 11 },
                    end: { line: 51, character: 22 },
                  },
                ]
              ));

            // Differentiating functions based on parameter list types has
            // still to be done
            it.skip("should distinguish between overloads based on parameter types", () =>
              assertDefinitionNavigation(
                definition,
                definitionUri,
                { line: 72, character: 9 },
                {
                  start: { line: 51, character: 11 },
                  end: { line: 51, character: 22 },
                }
              ));
          });
        });

        describe("between inheriting contracts", () => {
          before(async () => {
            ({
              server: { definition },
            } = await setupMockLanguageServer({
              documents: [{ uri: twoContractUri, analyze: true }],
              errors: [],
            }));

            await new Promise((resolve) => setTimeout(resolve, 500));
          });

          it("should navigate from constructor extension to contract declaration if underlying constructor does not exist", () =>
            assertDefinitionNavigation(
              definition,
              twoContractUri,
              { line: 10, character: 31 },
              {
                start: { line: 3, character: 9 },
                end: { line: 3, character: 16 },
              }
            ));

          it("should navigate from constructor extension to underlying contracts constructor if it exists", () =>
            assertDefinitionNavigation(
              definition,
              twoContractUri,
              { line: 18, character: 31 },
              {
                start: { line: 13, character: 9 },
                end: { line: 13, character: 12 },
              }
            ));

          // This is a guard against a bug where modifiers on constructors with no params jumped to the starting constructor
          // rather than the parent constructor
          it("should navigate from constructor extension to underlying contracts constructor even when start constructor has no args", () =>
            assertDefinitionNavigation(
              definition,
              twoContractUri,
              { line: 26, character: 16 },
              {
                start: { line: 21, character: 18 },
                end: { line: 21, character: 41 },
              }
            ));
        });

        describe("between unrelated contracts", () => {
          before(async () => {
            ({
              server: { definition },
            } = await setupMockLanguageServer({
              documents: [{ uri: twoContractUri, analyze: true }],
              errors: [],
            }));

            await new Promise((resolve) => setTimeout(resolve, 500));
          });

          it("should navigate from constructor invocation to contract declaration if constructor does not exist", () =>
            assertDefinitionNavigation(
              definition,
              twoContractUri,
              { line: 38, character: 8 },
              {
                start: { line: 29, character: 9 },
                end: { line: 29, character: 27 },
              }
            ));

          it("should navigate from constructor invocation to constructor if it exists", () =>
            assertDefinitionNavigation(
              definition,
              twoContractUri,
              { line: 42, character: 8 },
              {
                start: { line: 32, character: 9 },
                end: { line: 32, character: 24 },
              }
            ));
        });
      });

      describe("across multiple files", () => {
        const parentUri = forceToUnixStyle(
          path.join(__dirname, "testData", "multi-file", "Parent.sol")
        );
        const childUri = forceToUnixStyle(
          path.join(__dirname, "testData", "multi-file", "Child.sol")
        );
        let definition: OnDefinition;

        before(async () => {
          ({
            server: { definition },
          } = await setupMockLanguageServer({
            documents: [
              { uri: parentUri, analyze: true },
              { uri: childUri, analyze: true },
            ],
            errors: [],
          }));

          // required to allow the second indexing of Parent.sol to complete
          // and potentially wipe the ast clear of back refs to Child.sol
          await new Promise((resolve) => setTimeout(resolve, 500));
        });

        // This in combination with the multi-analysis setup is designed to catch issues
        // where the Parent is index, Child is indexed linking to Parent, Parent is reindexed
        // but at the point export back links need to be copied across
        it("should navigate from constructor extension to underlying contracts constructor across files", () =>
          assertDefinitionNavigation(
            definition,
            childUri,
            { line: 6, character: 16 },
            {
              start: { line: 3, character: 9 },
              end: { line: 3, character: 15 },
            }
          ));

        it("should navigate from constructor extension to underlying contracts constructor across files", () =>
          assertDefinitionNavigation(
            definition,
            childUri,
            { line: 11, character: 8 },
            {
              start: { line: 3, character: 9 },
              end: { line: 3, character: 15 },
            }
          ));

        it("should navigate from import statement to linked file (source unit)", () =>
          assertDefinitionNavigation(
            definition,
            childUri,
            { line: 3, character: 10 },
            {
              start: { line: 0, character: 0 },
              end: { line: 6, character: 0 },
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

  if (!response) {
    assert.fail("Expected a definition response but got null/undefined");
  }

  // If response is an array, use the first location
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const location = Array.isArray(response) ? (response as any)[0] : response;

  assert.exists(location);
  assert.deepStrictEqual(location?.range, expectedRange);
};

const assertMultiDefinitionNavigation = async (
  definition: OnDefinition,
  uri: string,
  position: VSCodePosition,
  expectedRanges: Array<{ start: VSCodePosition; end: VSCodePosition }>
) => {
  const response = await definition({ textDocument: { uri }, position });

  if (!response) {
    assert.fail("Expected definition responses but got null/undefined");
  }

  assert(
    Array.isArray(response),
    "Expected an array of locations for overloaded function"
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const locations = response as any[];

  assert.strictEqual(
    locations.length,
    expectedRanges.length,
    `Expected ${expectedRanges.length} definitions but got ${locations.length}`
  );

  for (let i = 0; i < expectedRanges.length; i++) {
    assert.deepStrictEqual(locations[i].range, expectedRanges[i]);
  }
};
