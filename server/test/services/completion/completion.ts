import { assert } from "chai";
import * as path from "path";
import { VSCodePosition } from "@common/types";
import {
  OnCompletion,
  setupMockLanguageServer,
} from "../../helpers/setupMockLanguageServer";
import { CompletionContext } from "vscode-languageserver/node";
import { forceToUnixStyle } from "../../helpers/forceToUnixStyle";

describe("Parser", () => {
  const globalVariablesUri = forceToUnixStyle(
    path.join(__dirname, "testData", "GlobalVariables.sol")
  );

  const memberAccessStructUri = forceToUnixStyle(
    path.join(__dirname, "testData", "MemberAccessStruct.sol")
  );

  const memberAccessNestedStructUri = forceToUnixStyle(
    path.join(__dirname, "testData", "MemberAccessNestedStruct.sol")
  );

  let completion: OnCompletion;

  before(async () => {
    ({
      server: { completion },
    } = await setupMockLanguageServer({
      documents: [
        { uri: globalVariablesUri, analyze: true },
        { uri: memberAccessStructUri, analyze: false },
        { uri: memberAccessNestedStructUri, analyze: false },
      ],
      errors: [],
    }));
  });

  describe("Completion", () => {
    describe("Member Access", () => {
      describe("structs", () => {
        it("should provide completions", () =>
          assertCompletion(
            completion,
            memberAccessStructUri,
            { line: 18, character: 13 },
            ["charisma", "intelligence", "strength", "wisdom"]
          ));

        it("should provide completions when nested", () =>
          assertCompletion(
            completion,
            memberAccessNestedStructUri,
            { line: 23, character: 19 },
            ["charisma", "intelligence", "strength", "wisdom"]
          ));
      });
    });

    describe("Global Variables", () => {
      it("should provide sender completions", () =>
        assertCompletion(
          completion,
          globalVariablesUri,
          { line: 5, character: 19 },
          ["data", "sender", "value"]
        ));

      it("should provide block completions", () =>
        assertCompletion(
          completion,
          globalVariablesUri,
          { line: 9, character: 21 },
          [
            "chainid",
            "coinbase",
            "difficulty",
            "gaslimit",
            "number",
            "timestamp",
          ]
        ));

      it("should provide tx completions", () =>
        assertCompletion(
          completion,
          globalVariablesUri,
          { line: 13, character: 18 },
          ["gasprice", "origin"]
        ));

      it("should provide abi completions", () =>
        assertCompletion(
          completion,
          globalVariablesUri,
          { line: 17, character: 19 },
          [
            "decode",
            "encode",
            "encodePacked",
            "encodeWithSelector",
            "encodeWithSelector",
            "encodeWithSignature",
          ]
        ));
    });
  });
});

const assertCompletion = async (
  completion: OnCompletion,
  documentUri: string,
  position: VSCodePosition,
  completionLabels: string[],
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
  const actual = response.items.map((item) => item.label).sort();
  const expected = completionLabels.sort();

  assert.deepStrictEqual(actual, expected);
};
