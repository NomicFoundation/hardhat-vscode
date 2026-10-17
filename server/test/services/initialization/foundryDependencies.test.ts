import { expect } from "chai";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "fs";
import os from "os";
import path from "path";
import { createSandbox } from "sinon";
import { URI } from "vscode-uri";
import { FoundryProject } from "../../../src/frameworks/Foundry/FoundryProject";
import { Hardhat2Project } from "../../../src/frameworks/Hardhat/Hardhat2/Hardhat2Project";
import * as forgeCommand from "../../../src/frameworks/Foundry/resolveForgeCommand";
import * as operatingSystem from "../../../src/utils/operatingSystem";
import { Hardhat3Project } from "../../../src/frameworks/Hardhat/Hardhat3/Hardhat3Project";
import { toUnixStyle } from "../../../src/utils";
import { WorkspaceFileRetriever } from "../../../src/utils/WorkspaceFileRetriever";
import { indexWorkspaceFolders } from "../../../src/services/initialization/indexWorkspaceFolders";
import { ServerState } from "../../../src/types";
import { setupMockLogger } from "../../helpers/setupMockLogger";

describe("Foundry library project discovery", function () {
  const sandbox = createSandbox();
  let root: string;
  let state: ServerState;
  let configs: Map<string, string[]>;

  beforeEach(() => {
    root = mkdtempSync(path.join(os.tmpdir(), "foundry-libraries-"));
    configs = new Map();
    const logger = setupMockLogger();
    logger.trackTime = async (_description, callback) => callback();
    state = {
      logger,
      workspaceFileRetriever: new WorkspaceFileRetriever(),
      indexedWorkspaceFolders: [],
      projects: {},
      solFileIndex: {},
    } as unknown as ServerState;
    sandbox.stub(forgeCommand, "resolveForgeCommand").resolves("forge");
    sandbox.stub(operatingSystem, "runCmd").callsFake(async (cmd, cwd) => {
      if (cmd === "forge config --json") {
        const libs = configs.get(cwd!);
        if (libs === undefined) throw new Error("Invalid Foundry config");
        return JSON.stringify({
          src: "src",
          test: "test",
          script: "script",
          libs,
        });
      }
      if (cmd === "forge remappings") return "";
      throw new Error(`Unexpected command: ${cmd}`);
    });
    // Hardhat initialization starts a worker process; discovery itself stays real.
    sandbox.stub(Hardhat2Project.prototype, "initialize").resolves();
    sandbox.stub(Hardhat3Project.prototype, "initialize").resolves();
  });

  afterEach(() => {
    sandbox.restore();
    rmSync(root, { recursive: true, force: true });
  });

  function config(relativeDirectory: string, name: string, libs?: string[]) {
    const directory = path.join(root, relativeDirectory);
    mkdirSync(directory, { recursive: true });
    const file = path.join(directory, name);
    writeFileSync(file, "");
    if (libs !== undefined) configs.set(directory, libs);
    return file;
  }

  async function index() {
    await indexWorkspaceFolders(state, state.workspaceFileRetriever, [
      { uri: URI.file(root).toString(), name: "workspace" },
    ]);
    return Object.keys(state.projects);
  }

  for (const lib of ["lib", "dependencies", "vendor"]) {
    it(`ignores dependency configs inside configured ${lib}`, async () => {
      const parent = config("app", "foundry.toml", [lib]);
      config(`app/${lib}/package`, "foundry.toml", ["lib"]);
      config(`app/${lib}/package`, "hardhat.config.js");
      const sibling = config(`app/${lib}-other`, "foundry.toml", []);
      expect(await index()).to.have.members([parent, sibling]);
      expect(state.projects[parent]).to.be.instanceOf(FoundryProject);
    });
  }

  it("discovers standalone projects named lib and dependencies", async () => {
    const first = config("lib/standalone", "foundry.toml", []);
    const second = config("dependencies/standalone", "foundry.toml", []);
    expect(await index()).to.have.members([first, second]);
  });

  it("keeps co-located Hardhat and Foundry configs", async () => {
    const foundry = config("app", "foundry.toml", ["."]);
    const hardhat = config("app", "hardhat.config.js");
    expect(await index()).to.have.members([foundry, hardhat]);
  });

  it("does not discard nested projects when the parent cannot initialize", async () => {
    const parent = config("app", "foundry.toml");
    const child = config("app/dependencies/package", "foundry.toml", []);
    expect(await index()).to.have.members([parent, child]);
    expect(
      (state.projects[parent] as FoundryProject).initializeError
    ).not.to.equal(undefined);
  });

  it("does not suppress independent projects outside the consuming project", async () => {
    const parent = config("app", "foundry.toml", ["../shared"]);
    const shared = config("shared", "foundry.toml", []);
    expect(await index()).to.have.members([parent, shared]);
  });

  it("keeps shared library source, test and script files in their own project", async () => {
    config("app", "foundry.toml", ["../shared"]);
    const shared = config("shared", "foundry.toml", []);
    const files = ["src", "test", "script"].map((dir) => {
      const directory = path.join(root, "shared", dir);
      mkdirSync(directory, { recursive: true });
      const file = path.join(directory, "C.sol");
      writeFileSync(file, "pragma solidity ^0.8.8;");
      return file;
    });
    await index();
    for (const file of files) {
      expect(state.solFileIndex[toUnixStyle(file)].project.configPath).to.equal(
        shared
      );
    }
  });

  it("reassigns dependency files when their consuming workspace is added later", async () => {
    const parent = config("app", "foundry.toml", ["dependencies"]);
    config("app/dependencies/pkg", "foundry.toml", []);
    config("app/dependencies/pkg", "hardhat.config.js");
    const peer = config("peer", "foundry.toml", []);
    const directory = path.join(root, "app/dependencies/pkg/src");
    mkdirSync(directory, { recursive: true });
    const file = path.join(directory, "C.sol");
    writeFileSync(file, "pragma solidity ^0.8.8;");
    const childRoot = path.join(root, "app/dependencies/pkg");
    await indexWorkspaceFolders(state, state.workspaceFileRetriever, [
      { uri: URI.file(childRoot).toString(), name: "dependency" },
    ]);
    expect(await index()).to.include(peer);
    expect(state.solFileIndex[toUnixStyle(file)].project.configPath).to.equal(
      parent
    );
  });

  it("ignores nested Hardhat 3 configs that inherit the consumer package.json", async () => {
    const parent = config("app", "foundry.toml", ["dependencies"]);
    writeFileSync(
      path.join(root, "app/package.json"),
      JSON.stringify({
        devDependencies: { hardhat: "^3.0.0" },
      })
    );
    config("app/dependencies/pkg", "hardhat.config.js");
    expect(await index()).to.have.members([parent]);
  });
});
