/* eslint-disable no-empty */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { execSync } from "child_process";
import path from "path";
import { DidChangeWatchedFilesParams } from "vscode-languageserver-protocol";
import { OpenDocuments, ServerState } from "../../types";
import { CompilationDetails } from "../base/CompilationDetails";
import { Project } from "../base/Project";
import { Remapping } from "../base/Remapping";

export class TruffleProject extends Project {
  public priority = 3;
  public sourcesPath!: string;
  public testsPath!: string;
  public remappings: Remapping[] = [];
  public initializeError?: string;
  public configSolcVersion?: string;

  constructor(
    serverState: ServerState,
    basePath: string,
    public configPath: string
  ) {
    super(serverState, basePath);
  }

  public id(): string {
    return this.configPath;
  }

  public frameworkName(): string {
    return "Truffle";
  }

  public async initialize(): Promise<void> {
    this.sourcesPath = path.join(this.basePath, "contracts");
    this.testsPath = path.join(this.basePath, "test");
  }

  public async fileBelongs(file: string): Promise<boolean> {
    return file.startsWith(this.sourcesPath) || file.startsWith(this.testsPath);
  }

  public async resolveImportPath(
    file: string,
    importPath: string
  ): Promise<string | undefined> {
    // const resolver = new Resolver({
    //   contracts_directory: this.sourcesPath,
    //   working_directory: this.basePath,
    //   contracts_build_directory: path.join(this.basePath, "build"),
    // });

    // const resolved = resolver.resolve(importPath, file);

    // console.log(`(${file},${importPath}) => ${resolved}`);

    // Absolute path
    if (path.isAbsolute(importPath)) {
      return importPath;
    }

    // Relative path
    if (importPath.startsWith(".") || importPath.startsWith("..")) {
      return path.resolve(path.dirname(file), importPath);
    }

    // Truffle direct imports
    const globalNodeModulesPath = execSync("npm root --quiet -g").toString();
    if (importPath.startsWith("truffle")) {
      try {
        return require.resolve(importPath.replace("truffle", "truffle/build"), {
          paths: [this.basePath, globalNodeModulesPath],
        });
      } catch (error) {}
    }

    // Node modules direct imports (local and global)
    try {
      return require.resolve(importPath, {
        paths: [this.basePath, globalNodeModulesPath],
      });
    } catch (error) {}

    return undefined;
  }

  public buildCompilation(
    sourceUri: string,
    openDocuments: OpenDocuments
  ): Promise<CompilationDetails> {
    throw new Error("Method not implemented.");
  }

  public async onWatchedFilesChanges(
    params: DidChangeWatchedFilesParams
  ): Promise<void> {
    return;
  }
}
