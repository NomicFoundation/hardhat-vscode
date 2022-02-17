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
      describe("within single file", () => {
        const definitionUri = path.join(
          __dirname,
          "testData",
          "Definition.sol"
        );

        const twoContractUri = path.join(
          __dirname,
          "testData",
          "TwoContracts.sol"
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
              { line: 19, character: 9 },
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
              { line: 16, character: 5 },
              {
                start: { line: 33, character: 9 },
                end: { line: 33, character: 12 },
              }
            ));

          describe("function overloads", () => {
            it("should navigate to function with overloads", () =>
              assertDefinitionNavigation(
                definition,
                definitionUri,
                { line: 70, character: 9 },
                {
                  start: { line: 39, character: 11 },
                  end: { line: 39, character: 22 },
                }
              ));

            it("should distinguish between overloads based on parameter cardinality", () =>
              assertDefinitionNavigation(
                definition,
                definitionUri,
                { line: 71, character: 9 },
                {
                  start: { line: 43, character: 11 },
                  end: { line: 43, character: 22 },
                }
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
                start: { line: 14, character: 2 },
                end: { line: 14, character: 13 },
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
                start: { line: 22, character: 2 },
                end: { line: 22, character: 13 },
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
                start: { line: 33, character: 2 },
                end: { line: 33, character: 13 },
              }
            ));
        });
      });

      describe("across multiple files", () => {
        const parentUri = path.join(
          __dirname,
          "testData",
          "multi-file",
          "Parent.sol"
        );
        const childUri = path.join(
          __dirname,
          "testData",
          "multi-file",
          "Child.sol"
        );
        let definition: OnDefinition;

        before(async () => {
          ({
            server: { definition },
          } = await setupMockLanguageServer({
            documents: [
              { uri: parentUri, analyze: true },
              { uri: childUri, analyze: true },
              { uri: parentUri, analyze: true },
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
              start: { line: 4, character: 2 },
              end: { line: 4, character: 13 },
            }
          ));

        it("should navigate from constructor extension to underlying contracts constructor across files", () =>
          assertDefinitionNavigation(
            definition,
            childUri,
            { line: 11, character: 8 },
            {
              start: { line: 4, character: 2 },
              end: { line: 4, character: 13 },
            }
          ));

        it("should navigate from import statment to linked file (source unit)", () =>
          assertDefinitionNavigation(
            definition,
            childUri,
            { line: 3, character: 10 },
            {
              start: { line: 1, character: 0 },
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

  if (!response || Array.isArray(response)) {
    assert.fail();
  }

  assert.exists(response);
  assert.deepStrictEqual(response?.range, expectedRange);
};
