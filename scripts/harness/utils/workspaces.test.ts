import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { EXAMPLE_WORKSPACES_DIR, ROOT_DIR } from "./paths.ts";
import { resolveWorkspace, workspaceNames } from "./workspaces.ts";

describe("resolveWorkspace", () => {
  it("resolves a known name to its directory", () => {
    assert.deepEqual(resolveWorkspace("foundry"), {
      name: "foundry",
      framework: "foundry",
      dir: path.join(EXAMPLE_WORKSPACES_DIR, "foundry"),
    });
  });

  it("rejects an unknown name, listing the known ones", () => {
    assert.throws(
      () => resolveWorkspace("truffle"),
      /Unknown workspace: truffle\. Expected one of: hardhat3, foundry, hardhat2/
    );
  });

  it("rejects names inherited from Object.prototype", () => {
    assert.throws(() => resolveWorkspace("toString"), /Unknown workspace/);
  });
});

describe("workspaceNames", () => {
  it("names exactly the directories under example-workspaces/", () => {
    const dirs = fs
      .readdirSync(EXAMPLE_WORKSPACES_DIR, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();

    assert.deepEqual([...workspaceNames()].sort(), dirs);
  });
});

describe(".vscode/launch.json", () => {
  it("offers exactly the example workspaces in its picker", () => {
    // JSONC: drop the whole-line comments, which are the only kind it has.
    const source = fs
      .readFileSync(path.join(ROOT_DIR, ".vscode", "launch.json"), "utf8")
      .replace(/^\s*\/\/.*$/gm, "");
    const { inputs } = JSON.parse(source) as {
      inputs: Array<{ id: string; options: string[] }>;
    };
    const picker = inputs.find(({ id }) => id === "exampleWorkspace");

    assert.deepEqual([...picker!.options].sort(), [...workspaceNames()].sort());
  });
});
