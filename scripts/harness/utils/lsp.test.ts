import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { probeFiles } from "./lsp.ts";

const hardhat = {
  configPath: "/ws/hardhat.config.ts",
  frameworkName: "Hardhat",
};
const foundry = {
  configPath: "/ws/sub/foundry.toml",
  frameworkName: "Foundry",
};
const none = { frameworkName: "None" };

describe("probeFiles", () => {
  it("picks one file per project, the first by path", () => {
    assert.deepEqual(
      probeFiles([
        { uri: "/ws/contracts/Greeter.sol", project: hardhat },
        { uri: "/ws/contracts/Box.sol", project: hardhat },
        { uri: "/ws/sub/src/Counter.sol", project: foundry },
      ]),
      ["/ws/contracts/Box.sol", "/ws/sub/src/Counter.sol"]
    );
  });

  it("prefers the project's own sources over its dependencies", () => {
    assert.deepEqual(
      probeFiles([
        { uri: "/ws/sub/lib/forge-std/src/Base.sol", project: foundry },
        { uri: "/ws/sub/src/Counter.sol", project: foundry },
        { uri: "/ws/node_modules/@openzeppelin/A.sol", project: hardhat },
      ]),
      ["/ws/node_modules/@openzeppelin/A.sol", "/ws/sub/src/Counter.sol"]
    );
  });

  it("leaves out files that belong to no project", () => {
    assert.deepEqual(
      probeFiles([{ uri: "/elsewhere/Loose.sol", project: none }]),
      []
    );
  });
});
