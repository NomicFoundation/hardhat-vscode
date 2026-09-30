import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { EXAMPLE_WORKSPACES_DIR } from "./paths.ts";
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
