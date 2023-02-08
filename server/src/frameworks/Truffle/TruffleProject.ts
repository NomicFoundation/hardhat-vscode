/* eslint-disable no-empty */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { execSync } from "child_process";
import _ from "lodash";
import path from "path";
import { DidChangeWatchedFilesParams } from "vscode-languageserver-protocol";
import { OpenDocuments, ServerState } from "../../types";
import { isRelativeImport } from "../../utils";
import { CompilationDetails } from "../base/CompilationDetails";
import { Project } from "../base/Project";
import { Remapping } from "../base/Remapping";
import { getDependenciesAndPragmas } from "../shared/crawlDependencies";

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
    this.configSolcVersion = "0.8.13"; // TODO: read config
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

  public async buildCompilation(
    sourceUri: string,
    openDocuments: OpenDocuments
  ): Promise<CompilationDetails> {
    // Load contract text from openDocuments
    const documentText = openDocuments.find(
      (doc) => doc.uri === sourceUri
    )?.documentText;

    if (documentText === undefined) {
      throw new Error(
        `sourceUri (${sourceUri}) should be included in openDocuments ${JSON.stringify(
          openDocuments.map((doc) => doc.uri)
        )} `
      );
    }

    // Get list of all dependencies (deep) and their pragma statements
    const dependencyDetails = await getDependenciesAndPragmas(this, sourceUri);

    // Use specified solc version from config
    const solcVersion = this.configSolcVersion!;

    // Build solc input
    const sources: { [uri: string]: { content: string } } = {};
    const remappings: string[] = [];

    for (const { sourceName, absolutePath } of dependencyDetails) {
      // Read all sol files via openDocuments or solFileIndex
      const contractText =
        openDocuments.find((doc) => doc.uri === absolutePath)?.documentText ??
        this.serverState.solFileIndex[absolutePath].text;

      if (contractText === undefined) {
        throw new Error(`Contract not indexed: ${absolutePath}`);
      }

      // Build the sources input
      sources[absolutePath] = { content: contractText };

      // Add an entry to remappings
      if (!isRelativeImport(sourceName) && sourceName !== absolutePath) {
        remappings.push(`${sourceName}=${absolutePath}`);
      }
    }

    sources[sourceUri] = { content: documentText };

    return {
      input: {
        language: "Solidity",
        sources,
        settings: {
          outputSelection: {},
          remappings,
          optimizer: {
            enabled: false,
            runs: 200,
          },
        },
      },
      solcVersion,
    } as any;
  }

  public async onWatchedFilesChanges(
    params: DidChangeWatchedFilesParams
  ): Promise<void> {
    return;
  }
}
