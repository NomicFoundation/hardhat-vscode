import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { tarballName } from "./packages.ts";

describe("tarballName", () => {
  it("drops the scope's @ and turns its / into a dash", () => {
    assert.equal(
      tarballName({
        name: "@nomicfoundation/solidity-language-server",
        version: "0.9.0",
      }),
      "nomicfoundation-solidity-language-server-0.9.0.tgz"
    );
  });

  it("leaves an unscoped name alone", () => {
    assert.equal(
      tarballName({ name: "hardhat-solidity", version: "1.2.3" }),
      "hardhat-solidity-1.2.3.tgz"
    );
  });
});
