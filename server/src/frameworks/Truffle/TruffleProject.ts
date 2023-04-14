/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-empty */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { execSync } from "child_process";
import { existsSync } from "fs";
import { readdir } from "fs/promises";
import _ from "lodash";
import path from "path";
import semver from "semver";
import { DidChangeWatchedFilesParams } from "vscode-languageserver-protocol";
import { OpenDocuments, ServerState } from "../../types";
import { isRelativeImport } from "../../utils";
import { directoryContains } from "../../utils/directoryContains";
import { CompilationDetails } from "../base/CompilationDetails";
import { BuildInputError } from "../base/Errors";
import { FileBelongsResult, Project } from "../base/Project";
import { Remapping } from "../base/Remapping";
import { getDependenciesAndPragmas } from "../shared/crawlDependencies";

enum Status {
  NOT_INITIALIZED,
  INITIALIZING,
  INITIALIZED_SUCCESS,
  INITIALIZED_FAILURE,
}

export class TruffleProject extends Project {
  public priority = 3;
  public sourcesPath!: string;
  public buildPath!: string;
  public testsPath!: string;
  public globalNodeModulesPath!: string;
  public remappings: Remapping[] = [];
  public initializeError?: string;
  public resolvedSolcVersion?: string;
  public status: Status = Status.NOT_INITIALIZED;

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
    this.status = Status.INITIALIZING;
    this.initializeError = undefined;
    this.testsPath = path.join(this.basePath, "test");

    this.globalNodeModulesPath = execSync("npm root --quiet -g").toString();

    try {
      // Load config file
      delete require.cache[require.resolve(this.configPath)];
      const config = require(this.configPath);

      // Find solc version statement
      const configSolcVersion = config?.compilers?.solc?.version;
      if (configSolcVersion === undefined) {
        throw new Error(
          `Missing solc version on config file (compilers.solc.version)`
        );
      }

      // Resolve version statement with available versions
      const resolvedSolcVersion = semver.maxSatisfying(
        this.serverState.solcVersions,
        configSolcVersion
      );
      if (resolvedSolcVersion === null) {
        throw new Error(
          `No version satisfies ${configSolcVersion}. Available versions are: ${this.serverState.solcVersions}`
        );
      }
      this.resolvedSolcVersion = resolvedSolcVersion;

      // Load contracts directory
      this.sourcesPath = path.resolve(
        this.basePath,
        config?.contracts_directory ?? "contracts"
      );

      this.buildPath = path.resolve(
        this.basePath,
        config?.contracts_build_directory ?? "./build/contracts"
      );

      this.status = Status.INITIALIZED_SUCCESS;
    } catch (error) {
      const errorMessage = `Error loading config file ${this.configPath}: ${error}`;
      this.status = Status.INITIALIZED_FAILURE;
      this.initializeError = errorMessage;
      throw new Error(errorMessage);
    }
  }

  public async fileBelongs(file: string): Promise<FileBelongsResult> {
    let belongs: boolean;
    if (this.status === Status.INITIALIZED_SUCCESS) {
      belongs = [this.sourcesPath, this.testsPath].some((dir) =>
        directoryContains(dir, path.dirname(file))
      );
    } else {
      // Claim ownership under all contracts on the base folder if initialization failed
      belongs = directoryContains(this.basePath, file);
    }

    return {
      belongs,
      isLocal: true,
    };
  }

  public async resolveImportPath(
    file: string,
    importPath: string
  ): Promise<string | undefined> {
    // Absolute path
    if (path.isAbsolute(importPath)) {
      return existsSync(importPath) ? importPath : undefined;
    }

    // Relative path
    if (importPath.startsWith(".") || importPath.startsWith("..")) {
      const resolvedPath = path.resolve(path.dirname(file), importPath);
      return existsSync(resolvedPath) ? resolvedPath : undefined;
    }

    // Truffle direct imports
    if (importPath.startsWith("truffle")) {
      try {
        return require.resolve(importPath.replace("truffle", "truffle/build"), {
          paths: [this.basePath, this.globalNodeModulesPath],
        });
      } catch (error) {}
    }

    // Node modules direct imports (local and global)
    try {
      return require.resolve(importPath, {
        paths: [this.basePath, this.globalNodeModulesPath],
      });
    } catch (error) {}

    return undefined;
  }

  public async buildCompilation(
    sourceUri: string,
    openDocuments: OpenDocuments
  ): Promise<CompilationDetails> {
    // Ensure project is initialized
    if (this.status !== Status.INITIALIZED_SUCCESS) {
      const buildError: BuildInputError = {
        _isBuildInputError: true,
        fileSpecificErrors: {},
        projectWideErrors: [
          {
            type: "general",
            message: `Truffle project couldn't initialize correctly: ${this.initializeError}`,
            source: "truffle",
          },
        ],
      };
      throw buildError;
    }

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
    const solcVersion = this.resolvedSolcVersion!;

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

    // Add current file to the sources
    sources[sourceUri] = { content: documentText };

    sources["truffle/DeployedAddresses.sol"] = {
      content: await this._resolveDeployedAddresses(),
    };

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
    };
  }

  public async onWatchedFilesChanges({
    changes,
  }: DidChangeWatchedFilesParams): Promise<void> {
    for (const change of changes) {
      if (this.configPath === change.uri) {
        this.serverState.logger.info(
          `Reinitializing truffle project: ${this.id()}`
        );

        await this.initialize();
      }
    }
    return;
  }

  private async _resolveDeployedAddresses(): Promise<string> {
    try {
      const contractFiles = await readdir(this.buildPath);

      const normalizedContractFiles = _.uniq(
        contractFiles.map((filePath) =>
          path.parse(path.basename(filePath)).name.replace(/\W/g, "")
        )
      );

      const fns = normalizedContractFiles
        .map(
          (contract) =>
            `  function ${contract}() public pure returns (address payable) {revert();}`
        )
        .join("\n");

      return `
// SPDX-License-Identifier: MIT
pragma solidity >=0.1.0;
        
library DeployedAddresses {
${fns}
}`;
    } catch {
      return "";
    }
  }
}
