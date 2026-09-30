import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveWorkspace } from "../utils/workspaces.ts";
import { parseStatus, resetTarget } from "./reset.ts";

describe("resetTarget", () => {
  it("prefers the named workspace over the recorded one", () => {
    assert.equal(
      resetTarget("foundry", resolveWorkspace("hardhat3")).name,
      "foundry"
    );
  });

  it("falls back to the recorded workspace", () => {
    assert.equal(
      resetTarget(undefined, resolveWorkspace("hardhat2")).name,
      "hardhat2"
    );
  });

  it("refuses to guess when neither is given", () => {
    assert.throws(
      () => resetTarget(undefined, undefined),
      /Pass --workspace <name>/
    );
  });
});

describe("parseStatus", () => {
  it("splits files new since HEAD from changed tracked ones", () => {
    const output = [
      " M example-workspaces/foundry/src/Counter.sol",
      "M  example-workspaces/foundry/foundry.toml",
      " D example-workspaces/foundry/README.md",
      "A  example-workspaces/foundry/src/Staged.sol",
      "?? example-workspaces/foundry/src/New.sol",
      "",
    ].join("\n");

    assert.deepEqual(parseStatus(output), {
      restored: [
        "example-workspaces/foundry/src/Counter.sol",
        "example-workspaces/foundry/foundry.toml",
        "example-workspaces/foundry/README.md",
      ],
      removed: [
        "example-workspaces/foundry/src/Staged.sol",
        "example-workspaces/foundry/src/New.sol",
      ],
    });
  });

  it("is empty for a clean workspace", () => {
    assert.deepEqual(parseStatus(""), { restored: [], removed: [] });
  });
});
