/* eslint-disable @typescript-eslint/no-explicit-any */
import { expect } from "chai";
import path from "path";
import { restore, stub } from "sinon";
import * as basicCompilation from "../../../src/frameworks/shared/buildBasicCompilation";
import { FoundryProject } from "../../../src/frameworks/Foundry/FoundryProject";
import { ServerState } from "../../../src/types";
import { toUnixStyle } from "../../../src/utils";

describe("FoundryProject", function () {
  let project: FoundryProject;
  const serverStateMock = {
    logger: {},
  } as ServerState;

  beforeEach(async () => {
    project = new FoundryProject(
      serverStateMock,
      path.join(__dirname, "test_project"),
      path.join(__dirname, "test_project", "foundry.toml")
    );
  });

  afterEach(() => {
    restore();
  });

  describe("resolveImportPath", function () {
    it("resolves relative imports", async () => {
      const foundImport = await project.resolveImportPath(
        path.join(project.basePath, "src", "A.sol"),
        "./B.sol"
      );
      const notFoundImport = await project.resolveImportPath(
        path.join(project.basePath, "src", "A.sol"),
        "./C.sol"
      );
      expect(foundImport).to.eq(
        toUnixStyle(path.join(project.basePath, "src", "B.sol"))
      );
      expect(notFoundImport).to.eq(undefined);
    });

    it("resolves root imports", async () => {
      const importFromSameLevel = await project.resolveImportPath(
        path.join(project.basePath, "src", "nested", "D.sol"),
        "nested/E.sol"
      );
      const importFromParent = await project.resolveImportPath(
        path.join(project.basePath, "src", "nested", "D.sol"),
        "src/A.sol"
      );
      const importFromLib = await project.resolveImportPath(
        path.join(project.basePath, "src", "nested", "D.sol"),
        "lib/C.sol"
      );
      const illegalImport = await project.resolveImportPath(
        path.join(project.basePath, "src", "A.sol"),
        "foundry/Illegal.sol"
      );

      expect(importFromSameLevel).to.eq(
        toUnixStyle(path.join(project.basePath, "src", "nested", "E.sol"))
      );
      expect(importFromParent).to.eq(
        toUnixStyle(path.join(project.basePath, "src", "A.sol"))
      );
      expect(importFromLib).to.eq(
        toUnixStyle(path.join(project.basePath, "lib", "C.sol"))
      );
      expect(illegalImport).to.eq(undefined);
    });
  });

  describe("buildCompilation", function () {
    it("replaces absolute paths provided by buildBasicCompilation with root-relative paths", async () => {
      const sourceUri = path.join(project.basePath, "src", "A.sol");

      stub(basicCompilation, "buildBasicCompilation").resolves({
        input: {
          sources: {
            [sourceUri]: { content: "" },
          },
          settings: {},
        },
      } as any);

      const compilation = await project.buildCompilation(sourceUri, []);
      expect(compilation.input.sources).to.deep.eq({
        [path.join("src", "A.sol")]: { content: "" },
      });
    });

    it("points remappings from buildBasicCompilation at the root-relative source keys", async () => {
      const sourceUri = path.join(project.basePath, "src", "A.sol");
      const libUri = path.join(project.basePath, "lib", "C.sol");
      const outsideUri = path.join(
        path.dirname(project.basePath),
        "outside",
        "D.sol"
      );

      project.remappings = [{ from: "lib/", to: "lib/" }];

      stub(basicCompilation, "buildBasicCompilation").resolves({
        input: {
          sources: {
            [sourceUri]: { content: "" },
            [libUri]: { content: "" },
            [outsideUri]: { content: "" },
          },
          settings: {
            remappings: [`dep/C.sol=${libUri}`, `outside/D.sol=${outsideUri}`],
          },
        },
      } as any);

      const compilation = await project.buildCompilation(sourceUri, []);

      expect(Object.keys(compilation.input.sources)).to.have.members([
        path.join("src", "A.sol"),
        path.join("lib", "C.sol"),
        outsideUri,
      ]);
      expect((compilation.input.settings as any).remappings).to.deep.eq([
        "lib/=lib/",
        `dep/C.sol=${path.join("lib", "C.sol")}`,
        `outside/D.sol=${outsideUri}`,
      ]);
    });
  });
});
