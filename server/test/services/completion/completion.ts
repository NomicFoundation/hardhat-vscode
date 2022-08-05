import { assert } from "chai";
import * as path from "path";
import { VSCodePosition } from "@common/types";
import { CompletionContext } from "vscode-languageserver/node";
import {
  OnCompletion,
  setupMockLanguageServer,
} from "../../helpers/setupMockLanguageServer";
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

  const memberAccessArraysUri = forceToUnixStyle(
    path.join(__dirname, "testData", "MemberAccessArrays.sol")
  );

  let completion: OnCompletion;

  describe("Completion", () => {
    describe("Member Access", () => {
      describe("structs", () => {
        before(async () => {
          ({
            server: { completion },
          } = await setupMockLanguageServer({
            documents: [
              { uri: memberAccessStructUri, analyze: false },
              { uri: memberAccessNestedStructUri, analyze: false },
            ],
            errors: [],
          }));
        });

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

      describe("arrays", () => {
        before(async () => {
          ({
            server: { completion },
          } = await setupMockLanguageServer({
            documents: [{ uri: memberAccessArraysUri, analyze: false }],
            errors: [],
          }));
        });

        it("should provide completions for local variables", () =>
          assertCompletion(
            completion,
            memberAccessArraysUri,
            { line: 21, character: 22 },
            ["length", "pop", "push"]
          ));

        it("should provide completions for state properties", () =>
          assertCompletion(
            completion,
            memberAccessArraysUri,
            { line: 22, character: 13 },
            ["length", "pop", "push"]
          ));

        it("should provide completions for array properties nested in structs", () =>
          assertCompletion(
            completion,
            memberAccessArraysUri,
            { line: 23, character: 25 },
            ["length", "pop", "push"]
          ));

        it("should provide completions for state properties inherited from a parent contract", () =>
          assertCompletion(
            completion,
            memberAccessArraysUri,
            { line: 24, character: 12 },
            ["length", "pop", "push"]
          ));

        it("should provide completions for array parameters", () =>
          assertCompletion(
            completion,
            memberAccessArraysUri,
            { line: 25, character: 20 },
            ["length", "pop", "push"]
          ));
      });
    });

    describe("Global Variables", () => {
      before(async () => {
        ({
          server: { completion },
        } = await setupMockLanguageServer({
          documents: [{ uri: globalVariablesUri, analyze: true }],
          errors: [],
        }));
      });

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

      it("should provide msg.sender completions", () =>
        assertCompletion(
          completion,
          globalVariablesUri,
          { line: 21, character: 26 },
          ["balance", "code", "codehash", "call", "delegatecall", "staticcall"]
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
