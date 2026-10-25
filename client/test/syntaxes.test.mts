import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

interface MatchRule {
  match: string;
  name: string;
}

const grammar = JSON.parse(
  readFileSync(new URL("../syntaxes/solidity.json", import.meta.url), "utf8")
);

const stringRules: MatchRule[] = grammar.repository.string.patterns;

// Scans a single line the way TextMate applies a list of `match` rules:
// at each position the earliest match wins, ties go to the first rule.
function scan(line: string, rules: MatchRule[]): Array<[string, string]> {
  const regexes = rules.map((rule) => new RegExp(rule.match, "g"));
  const tokens: Array<[string, string]> = [];
  let position = 0;

  while (position < line.length) {
    let best: { index: number; text: string; name: string } | undefined;

    for (const [i, regex] of regexes.entries()) {
      regex.lastIndex = position;
      const found = regex.exec(line);

      if (found !== null && (best === undefined || found.index < best.index)) {
        best = { index: found.index, text: found[0], name: rules[i].name };
      }
    }

    if (best === undefined || best.text === "") {
      break;
    }

    tokens.push([best.name, best.text]);
    position = best.index + best.text.length;
  }

  return tokens;
}

describe("solidity grammar strings", () => {
  it("keeps an escaped double quote inside a double-quoted string", () => {
    assert.deepEqual(
      scan(
        `return string.concat("\\"", string.concat(s, "\\""));`,
        stringRules
      ),
      [
        ["string.quoted.double", `"\\""`],
        ["string.quoted.double", `"\\""`],
      ]
    );
  });

  it("keeps an escaped single quote inside a single-quoted string", () => {
    assert.deepEqual(scan(`f('it\\'s', 'ok');`, stringRules), [
      ["string.quoted.single", `'it\\'s'`],
      ["string.quoted.single", `'ok'`],
    ]);
  });

  it("ends a string after an escaped backslash", () => {
    assert.deepEqual(scan(`f("C:\\\\", "x");`, stringRules), [
      ["string.quoted.double", `"C:\\\\"`],
      ["string.quoted.double", `"x"`],
    ]);
  });

  it("does not end a double-quoted string at a single quote", () => {
    assert.deepEqual(scan(`f("it's", 'a"b');`, stringRules), [
      ["string.quoted.double", `"it's"`],
      ["string.quoted.single", `'a"b'`],
    ]);
  });
});
