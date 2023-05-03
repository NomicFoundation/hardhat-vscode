/* eslint-disable @typescript-eslint/no-explicit-any */

import { existsSync, readFileSync } from "fs";
import _ from "lodash";
import { homedir } from "os";
import path from "path";
import {
  CompletionItem,
  DidChangeWatchedFilesParams,
  Position,
} from "vscode-languageserver-protocol";
import YAML from "yaml";
import { OpenDocuments, ServerState } from "../../types";
import { toUnixStyle } from "../../utils";
import { directoryContains } from "../../utils/directoryContains";
import { CompilationDetails } from "../base/CompilationDetails";
import { InitializationFailedError } from "../base/Errors";
import { FileBelongsResult, Project } from "../base/Project";
import { parseRemappingLine, Remapping } from "../base/Remapping";
import { buildBasicCompilation } from "../shared/buildBasicCompilation";
import { ApeConfig, ApeDependency } from "./types";

export class ApeProject extends Project {
  public priority = 1;
  public sourcesPath!: string;
  public dependenciesPath!: string;
  public remappings: Remapping[] = [];
  public initializeError?: string;
  public configSolcVersion?: string;
  public dependencies!: ApeDependency[];

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
    return "Ape";
  }

  public async initialize(): Promise<void> {
    this.initializeError = undefined; // clear any potential error on restart

    try {
      const configContent = readFileSync(this.configPath).toString();
      const config: ApeConfig = YAML.parse(configContent);

      this.configSolcVersion = config.solidity?.version;

      const configSourcesPath = (
        config.contracts_folder ?? "contracts"
      ).replace("~", homedir());

      this.sourcesPath = path.resolve(this.basePath, configSourcesPath);

      this.dependenciesPath = path.join(this.sourcesPath, ".cache");

      const configRemappings = config.solidity?.import_remapping ?? [];

      this.remappings = _.compact(configRemappings.map(parseRemappingLine));

      this.dependencies = config.dependencies ?? [];

      // check that dependencies are installed

      for (const dependency of this.dependencies) {
        const isInstalled =
          this._resolveDependencyBasePath(dependency) !== undefined;

        if (!isInstalled) {
          throw new Error(
            `Dependency ${dependency.name} is declared on config file but we couldn't find it inside ${this.dependenciesPath}. Try installing your dependencies by running 'ape compile'.`
          );
        }
      }
    } catch (error) {
      this.initializeError = `${error}`;
      this.serverState.logger.info(this.initializeError);
    }

    return;
  }

  public async fileBelongs(uri: string): Promise<FileBelongsResult> {
    if (this.initializeError === undefined) {
      const belongs = directoryContains(this.sourcesPath, uri);
      const isLocal = !directoryContains(this.dependenciesPath, uri);

      return { belongs, isLocal };
    } else {
      // Project could not be initialized. Claim all files under base path to avoid them being incorrectly assigned to other projects
      return { belongs: directoryContains(this.basePath, uri), isLocal: false };
    }
  }

  public async resolveImportPath(file: string, importPath: string) {
    let transformedPath = importPath;

    // Apply remappings to importPath
    for (const { from, to } of this.remappings) {
      if (!importPath.startsWith(from)) {
        continue;
      }

      // Extract dependency name e.g. `@openzeppelin=OpenZeppelin/4.4.2` => `OpenZeppelin`
      const [dependencyName] = to.split("/");

      if (dependencyName === undefined) {
        continue;
      }

      // Find the dependency by name by searching config's registered dependencies
      const dependency = this.dependencies.find(
        (d) => d.name === dependencyName
      );

      if (dependency === undefined) {
        continue;
      }

      // Dependencies' subfolders are different if they are specified by version or branch
      const dependencyBasePath = this._resolveDependencyBasePath(dependency);

      transformedPath = importPath.replace(
        from.endsWith("/") ? from : `${from}/`,
        `${dependencyBasePath}/`
      );
    }

    // Try to resolve the import recursively, start from source directory up to project root
    let testBaseDirectory = path.dirname(file);
    let resolvedPath: string | undefined;

    while (directoryContains(this.basePath, testBaseDirectory)) {
      const testResolvedPath = path.resolve(testBaseDirectory, transformedPath);

      if (existsSync(testResolvedPath)) {
        resolvedPath = testResolvedPath;
        break;
      }

      testBaseDirectory = path.dirname(testBaseDirectory);
    }

    return resolvedPath !== undefined ? toUnixStyle(resolvedPath) : undefined;
  }

  public async buildCompilation(
    sourceUri: string,
    openDocuments: OpenDocuments
  ): Promise<CompilationDetails> {
    // Ensure project is initialized
    if (this.initializeError !== undefined) {
      const error: InitializationFailedError = {
        _isInitializationFailedError: true,
        error: this.initializeError,
      };

      throw error;
    }

    const basicCompilation = await buildBasicCompilation(
      this,
      sourceUri,
      openDocuments,
      this.configSolcVersion
    );

    return basicCompilation;
  }

  public async onWatchedFilesChanges({
    changes,
  }: DidChangeWatchedFilesParams): Promise<void> {
    for (const change of changes) {
      if (change.uri === this.configPath) {
        this.serverState.logger.info(
          `Reinitializing Ape project: ${this.id()}`
        );
        await this.initialize();
      }
    }
    return;
  }

  public getImportCompletions(
    _position: Position,
    _currentImport: string
  ): CompletionItem[] {
    return [];
  }

  /**
   * Given a dependency specified in ape config file, attempts to find the directory where it's been installed
   */
  private _resolveDependencyBasePath(
    dependency: ApeDependency
  ): string | undefined {
    const possibleSubfolders = [];

    if (dependency.version !== undefined) {
      possibleSubfolders.push(dependency.version);
      possibleSubfolders.push(`v${dependency.version}`);
    }

    if (dependency.branch !== undefined) {
      possibleSubfolders.push(dependency.branch);
    }

    if (dependency.local !== undefined) {
      possibleSubfolders.push("local");
    }

    for (const subfolder of possibleSubfolders) {
      const dependencyBasePath = path.join(
        this.dependenciesPath,
        dependency.name,
        subfolder
      );

      if (existsSync(dependencyBasePath)) {
        return dependencyBasePath;
      }
    }
  }
}
