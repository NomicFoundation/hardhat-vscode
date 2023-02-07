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
  }

  public async fileBelongs(file: string): Promise<boolean> {
    return file.startsWith(this.sourcesPath);
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

    if (path.isAbsolute(importPath)) {
      return importPath;
    }

    if (importPath.startsWith(".") || importPath.startsWith("..")) {
      return path.resolve(path.dirname(file), importPath);
    }

    if (importPath.startsWith("truffle")) {
      return require.resolve(importPath.replace("truffle", "truffle/build"), {
        paths: [this.basePath, execSync("npm root --quiet -g").toString()],
      });
    }

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
