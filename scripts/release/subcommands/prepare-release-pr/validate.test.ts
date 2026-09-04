import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseBumps, problemsWith } from "./validate.ts";

const ALL_THREE = new Map([
  ["hardhat-solidity", "patch"],
  ["@nomicfoundation/solidity-language-server", "patch"],
  ["@nomicfoundation/coc-solidity", "patch"],
]);

describe("parseBumps", () => {
  it("reads the package and bump from each frontmatter line", () => {
    assert.deepEqual(
      parseBumps(
        "a.md",
        '---\n"hardhat-solidity": minor\n---\n\nSomething changed.\n'
      ),
      new Map([["hardhat-solidity", "minor"]])
    );
  });

  it("throws when there is no frontmatter", () => {
    assert.throws(() => parseBumps("a.md", "Just prose.\n"), /no frontmatter/);
  });

  it("throws rather than skipping a line it cannot read", () => {
    assert.throws(
      () => parseBumps("a.md", '---\n"hardhat-solidity": huge\n---\n'),
      /cannot read frontmatter line/
    );
  });
});

describe("problemsWith", () => {
  it("accepts all three packages on one bump", () => {
    assert.deepEqual(problemsWith(ALL_THREE), []);
  });

  it("names the packages a changeset left out", () => {
    assert.deepEqual(
      problemsWith(
        new Map([["@nomicfoundation/solidity-language-server", "patch"]])
      ),
      ["does not name hardhat-solidity, @nomicfoundation/coc-solidity"]
    );
  });

  it("rejects a package that is not released", () => {
    assert.deepEqual(
      problemsWith(new Map([...ALL_THREE, ["some-other-package", "patch"]])),
      ["names unknown package(s) some-other-package"]
    );
  });

  it("rejects a major bump", () => {
    assert.deepEqual(
      problemsWith(
        new Map([...ALL_THREE.keys()].map((name) => [name, "major"] as const))
      ),
      [
        "asks for a major bump; taking the extension to its next major is a decision to make deliberately, not one to fall out of a changeset",
      ]
    );
  });

  it("accepts minor", () => {
    assert.deepEqual(
      problemsWith(
        new Map([...ALL_THREE.keys()].map((name) => [name, "minor"] as const))
      ),
      []
    );
  });

  it("rejects mixed bump types, since the three are a fixed group", () => {
    assert.deepEqual(
      problemsWith(new Map([...ALL_THREE, ["hardhat-solidity", "minor"]])),
      ["mixes bump types (minor, patch)"]
    );
  });
});
