/* eslint-disable @typescript-eslint/no-explicit-any */
import { expect } from "chai";
import path from "path";
import { createSandbox, stub } from "sinon";
import * as operatingSystem from "../../../src/utils/operatingSystem";
import * as forgeCommand from "../../../src/frameworks/Foundry/resolveForgeCommand";
import { setupMockLogger } from "../../helpers/setupMockLogger";
import * as basicCompilation from "../../../src/frameworks/shared/buildBasicCompilation";
import { FoundryProject } from "../../../src/frameworks/Foundry/FoundryProject";
import { ServerState } from "../../../src/types";
import { toUnixStyle } from "../../../src/utils";

describe("FoundryProject", function () {
  let project: FoundryProject;
  const serverStateMock = {
    logger: setupMockLogger(),
  } as ServerState;

  beforeEach(async () => {
    project = new FoundryProject(
      serverStateMock,
      path.join(__dirname, "test_project"),
      path.join(__dirname, "test_project", "foundry.toml")
    );
  });

  describe("configured library directories", function () {
    const sandbox = createSandbox();
    let libs: string[] | undefined;

    beforeEach(() => {
      sandbox.stub(forgeCommand, "resolveForgeCommand").resolves("forge");
      sandbox.stub(operatingSystem, "runCmd").callsFake(async (cmd) => {
        if (cmd === "forge config --json") {
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
    });

    afterEach(() => sandbox.restore());

    for (const directory of ["lib", "dependencies", "vendor"]) {
      it(`assigns files in configured ${directory} to the project`, async () => {
        libs = [directory];
        await project.initialize();
        expect(project.initializeError).to.equal(undefined);
        expect(
          await project.fileBelongs(
            path.join(project.basePath, directory, "package", "A.sol")
          )
        ).to.deep.equal({ belongs: true, isLocal: false });
        expect(
          await project.fileBelongs(
            path.join(project.basePath, `${directory}-other`, "A.sol")
          )
        ).to.deep.equal({ belongs: false, isLocal: false });
      });
    }

    it("supports multiple and absolute library directories", async () => {
      const absoluteLib = path.resolve(project.basePath, "..", "shared");
      libs = ["dependencies", absoluteLib];
      await project.initialize();
      for (const directory of [
        path.join(project.basePath, "dependencies"),
        absoluteLib,
      ]) {
        expect(
          await project.fileBelongs(path.join(directory, "A.sol"))
        ).to.deep.equal({ belongs: true, isLocal: false });
      }
    });

    it("does not claim lib when libs is explicitly empty", async () => {
      libs = [];
      await project.initialize();
      expect(
        await project.fileBelongs(path.join(project.basePath, "lib", "A.sol"))
      ).to.deep.equal({ belongs: false, isLocal: false });
    });

    it("defaults to lib when the configuration omits libs", async () => {
      libs = undefined;
      await project.initialize();
      expect(
        await project.fileBelongs(path.join(project.basePath, "lib", "A.sol"))
      ).to.deep.equal({ belongs: true, isLocal: false });
    });

    it("replaces library directories on reinitialization", async () => {
      libs = ["dependencies"];
      await project.initialize();
      libs = ["vendor"];
      await project.initialize();
      expect(
        (
          await project.fileBelongs(
            path.join(project.basePath, "dependencies", "A.sol")
          )
        ).belongs
      ).to.equal(false);
      expect(
        (
          await project.fileBelongs(
            path.join(project.basePath, "vendor", "A.sol")
          )
        ).belongs
      ).to.equal(true);
    });
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
  });
});
