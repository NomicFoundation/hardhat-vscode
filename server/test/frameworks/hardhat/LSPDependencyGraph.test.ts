import path from "path";
import { expect } from "chai";
import { removeSync } from "fs-extra";
import { readFileSync, writeFileSync } from "fs";
import { LSPDependencyGraph } from "../../../src/frameworks/Hardhat/Hardhat3/LSPDependencyGraph";

// See image.png inside lsp_dg_project for the graph
describe("LSPDependencyGraph", () => {
  let dg: LSPDependencyGraph;

  beforeEach(async () => {
    const { ResolverImplementation } = await import(
      "hardhat3/internal/lsp-helpers"
    );
    const resolverFactory = () => {
      return ResolverImplementation.create(
        projectPath,
        async (filePath: string) => readFileSync(filePath).toString()
      );
    };
    dg = new LSPDependencyGraph(resolverFactory);
  });

  const projectPath = path.join(__dirname, "lsp_dg_project");
  const contractPath = (contractName: string) =>
    path.join(projectPath, `${contractName}.sol`);

  describe("#walkFile", function () {
    it("walking a file with no dependencies", async () => {
      await dg.walkFile(contractPath("I"));

      expect(Array.from(dg.files.keys())).to.deep.equal([contractPath("I")]);
      expect(Array.from(dg.dependencies.get(contractPath("I"))!)).to.deep.eq(
        []
      );
      expect(Array.from(dg.dependants.get(contractPath("I"))!)).to.deep.eq([]);
      expect(dg.unresolvedImports.size).to.eq(0);
    });

    it("walking a file with only one unresolved dependency", async () => {
      await dg.walkFile(contractPath("H"));

      expect(Array.from(dg.files.keys())).to.deep.equal([contractPath("H")]);
      expect(Array.from(dg.dependencies.get(contractPath("H"))!)).to.deep.eq(
        []
      );
      expect(Array.from(dg.dependants.get(contractPath("H"))!)).to.deep.eq([]);
      expect(dg.unresolvedImports.size).to.eq(1);
      expect(
        Array.from(dg.unresolvedImports.get(contractPath("H"))!)
      ).to.deep.eq(["./nonexistent2.sol"]);
    });

    it("walking a file with one dependency and some unresolved", async () => {
      await dg.walkFile(contractPath("C"));

      expect(Array.from(dg.files.keys())).to.deep.equal([
        contractPath("C"),
        contractPath("H"),
      ]);

      expect(Array.from(dg.dependencies.get(contractPath("C"))!)).to.deep.eq([
        { fileAbsPath: contractPath("H"), importPath: "./H.sol" },
      ]);
      expect(Array.from(dg.dependencies.get(contractPath("H"))!)).to.deep.eq(
        []
      );

      expect(Array.from(dg.dependants.get(contractPath("H"))!)).to.deep.eq([
        { fileAbsPath: contractPath("C"), importPath: "./H.sol" },
      ]);
      expect(Array.from(dg.dependants.get(contractPath("C"))!)).to.deep.eq([]);

      expect(dg.unresolvedImports.size).to.eq(2);
      expect(
        Array.from(dg.unresolvedImports.get(contractPath("C"))!)
      ).to.deep.eq(["./nonexistent1.sol"]);
      expect(
        Array.from(dg.unresolvedImports.get(contractPath("H"))!)
      ).to.deep.eq(["./nonexistent2.sol"]);
    });

    it("walking subpaths several times starting from leaves will not duplicate files or links", async () => {
      await dg.walkFile(contractPath("H"));
      await dg.walkFile(contractPath("C"));
      await dg.walkFile(contractPath("B"));
      await dg.walkFile(contractPath("D"));

      expect(Array.from(dg.files.keys())).to.deep.equal([
        contractPath("H"),
        contractPath("C"),
        contractPath("B"),
        contractPath("D"),
      ]);

      expect(Array.from(dg.dependencies.get(contractPath("H"))!)).to.deep.eq(
        []
      );
      expect(Array.from(dg.dependencies.get(contractPath("C"))!)).to.deep.eq([
        { fileAbsPath: contractPath("H"), importPath: "./H.sol" },
      ]);
      expect(Array.from(dg.dependencies.get(contractPath("B"))!)).to.deep.eq([
        { fileAbsPath: contractPath("C"), importPath: "./C.sol" },
        { fileAbsPath: contractPath("D"), importPath: "./D.sol" },
      ]);
      expect(Array.from(dg.dependencies.get(contractPath("D"))!)).to.deep.eq([
        { fileAbsPath: contractPath("C"), importPath: "./C.sol" },
      ]);

      expect(Array.from(dg.dependants.get(contractPath("H"))!)).to.deep.eq([
        { fileAbsPath: contractPath("C"), importPath: "./H.sol" },
      ]);
      expect(Array.from(dg.dependants.get(contractPath("C"))!)).to.deep.eq([
        { fileAbsPath: contractPath("B"), importPath: "./C.sol" },
        { fileAbsPath: contractPath("D"), importPath: "./C.sol" },
      ]);
      expect(Array.from(dg.dependants.get(contractPath("B"))!)).to.deep.eq([]);
      expect(Array.from(dg.dependants.get(contractPath("D"))!)).to.deep.eq([
        { fileAbsPath: contractPath("B"), importPath: "./D.sol" },
      ]);

      expect(dg.unresolvedImports.size).to.eq(2);
      expect(
        Array.from(dg.unresolvedImports.get(contractPath("C"))!)
      ).to.deep.eq(["./nonexistent1.sol"]);
      expect(
        Array.from(dg.unresolvedImports.get(contractPath("H"))!)
      ).to.deep.eq(["./nonexistent2.sol"]);
    });

    it("walking subpaths several times starting from roots will not duplicate files or links", async () => {
      await dg.walkFile(contractPath("A"));
      await dg.walkFile(contractPath("F"));
      await dg.walkFile(contractPath("B"));
      await dg.walkFile(contractPath("D"));
      await dg.walkFile(contractPath("E"));
      await dg.walkFile(contractPath("I"));
      await dg.walkFile(contractPath("C"));
      await dg.walkFile(contractPath("G"));
      await dg.walkFile(contractPath("H"));

      expect(Array.from(dg.files.keys()).sort()).to.deep.equal([
        contractPath("A"),
        contractPath("B"),
        contractPath("C"),
        contractPath("D"),
        contractPath("E"),
        contractPath("F"),
        contractPath("G"),
        contractPath("H"),
        contractPath("I"),
      ]);

      expect(Array.from(dg.dependencies.get(contractPath("A"))!)).to.deep.eq([
        { fileAbsPath: contractPath("B"), importPath: "./B.sol" },
        { fileAbsPath: contractPath("D"), importPath: "./D.sol" },
        { fileAbsPath: contractPath("E"), importPath: "./E.sol" },
      ]);
      expect(Array.from(dg.dependencies.get(contractPath("B"))!)).to.deep.eq([
        { fileAbsPath: contractPath("C"), importPath: "./C.sol" },
        { fileAbsPath: contractPath("D"), importPath: "./D.sol" },
      ]);
      expect(Array.from(dg.dependencies.get(contractPath("C"))!)).to.deep.eq([
        { fileAbsPath: contractPath("H"), importPath: "./H.sol" },
      ]);
      expect(Array.from(dg.dependencies.get(contractPath("D"))!)).to.deep.eq([
        { fileAbsPath: contractPath("C"), importPath: "./C.sol" },
      ]);
      expect(Array.from(dg.dependencies.get(contractPath("E"))!)).to.deep.eq([
        { fileAbsPath: contractPath("G"), importPath: "./G.sol" },
      ]);
      expect(Array.from(dg.dependencies.get(contractPath("F"))!)).to.deep.eq([
        { fileAbsPath: contractPath("E"), importPath: "./E.sol" },
        { fileAbsPath: contractPath("G"), importPath: "./G.sol" },
        { fileAbsPath: contractPath("I"), importPath: "./I.sol" },
      ]);
      expect(Array.from(dg.dependencies.get(contractPath("G"))!)).to.deep.eq([
        { fileAbsPath: contractPath("H"), importPath: "./H.sol" },
        { fileAbsPath: contractPath("D"), importPath: "./D.sol" },
      ]);
      expect(Array.from(dg.dependencies.get(contractPath("H"))!)).to.deep.eq(
        []
      );
      expect(Array.from(dg.dependencies.get(contractPath("I"))!)).to.deep.eq(
        []
      );

      expect(Array.from(dg.dependants.get(contractPath("A"))!)).to.deep.eq([]);
      expect(Array.from(dg.dependants.get(contractPath("B"))!)).to.deep.eq([
        { fileAbsPath: contractPath("A"), importPath: "./B.sol" },
      ]);
      expect(Array.from(dg.dependants.get(contractPath("C"))!)).to.deep.eq([
        { fileAbsPath: contractPath("D"), importPath: "./C.sol" },
        { fileAbsPath: contractPath("B"), importPath: "./C.sol" },
      ]);
      expect(Array.from(dg.dependants.get(contractPath("D"))!)).to.deep.eq([
        { fileAbsPath: contractPath("A"), importPath: "./D.sol" },
        { fileAbsPath: contractPath("G"), importPath: "./D.sol" },
        { fileAbsPath: contractPath("B"), importPath: "./D.sol" },
      ]);
      expect(Array.from(dg.dependants.get(contractPath("E"))!)).to.deep.eq([
        { fileAbsPath: contractPath("A"), importPath: "./E.sol" },
        { fileAbsPath: contractPath("F"), importPath: "./E.sol" },
      ]);
      expect(Array.from(dg.dependants.get(contractPath("F"))!)).to.deep.eq([]);
      expect(Array.from(dg.dependants.get(contractPath("G"))!)).to.deep.eq([
        { fileAbsPath: contractPath("E"), importPath: "./G.sol" },
        { fileAbsPath: contractPath("F"), importPath: "./G.sol" },
      ]);
      expect(Array.from(dg.dependants.get(contractPath("H"))!)).to.deep.eq([
        { fileAbsPath: contractPath("G"), importPath: "./H.sol" },
        { fileAbsPath: contractPath("C"), importPath: "./H.sol" },
      ]);
      expect(Array.from(dg.dependants.get(contractPath("I"))!)).to.deep.eq([
        { fileAbsPath: contractPath("F"), importPath: "./I.sol" },
      ]);

      expect(dg.unresolvedImports.size).to.eq(2);
      expect(
        Array.from(dg.unresolvedImports.get(contractPath("C"))!)
      ).to.deep.eq(["./nonexistent1.sol"]);
      expect(
        Array.from(dg.unresolvedImports.get(contractPath("H"))!)
      ).to.deep.eq(["./nonexistent2.sol"]);
    });
  });

  describe("#deleteFile", function () {
    it("deletes from dependent's dependencies", async () => {
      await dg.walkFile(contractPath("C"));

      expect(Array.from(dg.dependencies.get(contractPath("C"))!)).to.deep.eq([
        { fileAbsPath: contractPath("H"), importPath: "./H.sol" },
      ]);

      await dg.deleteFile(contractPath("H"));

      expect(Array.from(dg.dependencies.get(contractPath("C"))!)).to.deep.eq(
        []
      );
    });

    it("deletes from dependencies's dependants", async () => {
      await dg.walkFile(contractPath("C"));

      expect(Array.from(dg.dependants.get(contractPath("H"))!)).to.deep.eq([
        { fileAbsPath: contractPath("C"), importPath: "./H.sol" },
      ]);

      await dg.deleteFile(contractPath("C"));

      expect(Array.from(dg.dependants.get(contractPath("H"))!)).to.deep.eq([]);
    });

    it("adds to dependants' unresolved dependencies", async () => {
      await dg.walkFile(contractPath("C"));

      expect(
        Array.from(dg.unresolvedImports.get(contractPath("C"))!)
      ).to.deep.eq(["./nonexistent1.sol"]);

      await dg.deleteFile(contractPath("H"));

      expect(
        Array.from(dg.unresolvedImports.get(contractPath("C"))!)
      ).to.deep.eq(["./nonexistent1.sol", "./H.sol"]);
    });

    it("removes this file's entry, dependencies and dependants", async () => {
      await dg.walkFile(contractPath("C"));

      expect(Array.from(dg.files.keys())).to.deep.equal([
        contractPath("C"),
        contractPath("H"),
      ]);
      expect(dg.dependencies.size).to.eq(2);
      expect(Array.from(dg.dependencies.get(contractPath("C"))!)).to.deep.eq([
        { fileAbsPath: contractPath("H"), importPath: "./H.sol" },
      ]);
      expect(dg.dependants.size).to.eq(2);
      expect(Array.from(dg.dependants.get(contractPath("H"))!)).to.deep.eq([
        { fileAbsPath: contractPath("C"), importPath: "./H.sol" },
      ]);

      await dg.deleteFile(contractPath("C"));

      expect(Array.from(dg.files.keys())).to.deep.equal([contractPath("H")]);

      expect(dg.dependencies.size).to.eq(1);
      expect(Array.from(dg.dependencies.get(contractPath("H"))!)).to.deep.eq(
        []
      );
      expect(dg.dependants.size).to.eq(1);
      expect(Array.from(dg.dependants.get(contractPath("H"))!)).to.deep.eq([]);
    });

    it("removes unresolved dependencies for this file", async () => {
      await dg.walkFile(contractPath("C"));

      expect(dg.unresolvedImports.size).to.eq(2);

      expect(
        Array.from(dg.unresolvedImports.get(contractPath("C"))!)
      ).to.deep.eq(["./nonexistent1.sol"]);

      await dg.deleteFile(contractPath("C"));

      expect(dg.unresolvedImports.size).to.eq(1);
    });
  });

  describe("#addNewFile", function () {
    afterEach(() => {
      removeSync(contractPath("nonexistent2"));
    });
    beforeEach(() => {
      removeSync(contractPath("nonexistent2"));
    });

    it("walks the file", async () => {
      await dg.addNewFile(contractPath("C"));

      expect(Array.from(dg.files.keys())).to.deep.equal([
        contractPath("C"),
        contractPath("H"),
      ]);

      expect(dg.dependencies.size).to.eq(2);
      expect(Array.from(dg.dependencies.get(contractPath("C"))!)).to.deep.eq([
        { fileAbsPath: contractPath("H"), importPath: "./H.sol" },
      ]);
      expect(Array.from(dg.dependencies.get(contractPath("H"))!)).to.deep.eq(
        []
      );

      expect(dg.dependants.size).to.eq(2);
      expect(Array.from(dg.dependants.get(contractPath("H"))!)).to.deep.eq([
        { fileAbsPath: contractPath("C"), importPath: "./H.sol" },
      ]);
      expect(Array.from(dg.dependants.get(contractPath("C"))!)).to.deep.eq([]);

      expect(dg.unresolvedImports.size).to.eq(2);
      expect(
        Array.from(dg.unresolvedImports.get(contractPath("C"))!)
      ).to.deep.eq(["./nonexistent1.sol"]);
      expect(
        Array.from(dg.unresolvedImports.get(contractPath("H"))!)
      ).to.deep.eq(["./nonexistent2.sol"]);
    });

    it("resolves a previously unresolved link", async () => {
      await dg.walkFile(contractPath("H"));

      expect(Array.from(dg.dependencies.get(contractPath("H"))!)).to.deep.eq(
        []
      );

      expect(dg.unresolvedImports.size).to.eq(1);
      expect(
        Array.from(dg.unresolvedImports.get(contractPath("H"))!)
      ).to.deep.eq(["./nonexistent2.sol"]);

      writeFileSync(contractPath("nonexistent2"), "");
      await dg.addNewFile(contractPath("nonexistent2"));

      expect(
        Array.from(dg.unresolvedImports.get(contractPath("H"))!)
      ).to.deep.eq([]);

      expect(Array.from(dg.dependencies.get(contractPath("H"))!)).to.deep.eq([
        {
          fileAbsPath: contractPath("nonexistent2"),
          importPath: "./nonexistent2.sol",
        },
      ]);

      expect(
        Array.from(dg.dependants.get(contractPath("nonexistent2"))!)
      ).to.deep.eq([
        { fileAbsPath: contractPath("H"), importPath: "./nonexistent2.sol" },
      ]);
    });
  });

  describe("#resolveImport", function () {
    it("returns the absolute path of the resolved import if its present in the graph", async () => {
      await dg.walkFile(contractPath("C"));

      expect(dg.resolveImport(contractPath("C"), "./H.sol")).to.eq(
        contractPath("H")
      );
    });

    it("returns undefined if the import is not present in the graph", async () => {
      await dg.walkFile(contractPath("C"));

      expect(dg.resolveImport(contractPath("C"), "./nonexistent1.sol")).to.eq(
        undefined
      );
    });
  });
});
