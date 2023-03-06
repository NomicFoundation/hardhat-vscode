/* eslint-disable @typescript-eslint/no-explicit-any */
import { existsSync } from "fs";
import _ from "lodash";
import path from "path";
import {
  CompletionItem,
  DidChangeWatchedFilesParams,
  Position,
} from "vscode-languageserver-protocol";
import { OpenDocuments, ServerState } from "../../types";
import { toUnixStyle } from "../../utils";
import { directoryContains } from "../../utils/directoryContains";
import { runCmd, runningOnWindows } from "../../utils/operatingSystem";
import { CompilationDetails } from "../base/CompilationDetails";
import { InitializationFailedError } from "../base/Errors";
import { Project } from "../base/Project";
import { buildBasicCompilation } from "../shared/buildBasicCompilation";
import { getImportCompletions } from "./getImportCompletions";
import { Remapping } from "./Remapping";

export class FoundryProject extends Project {
  public priority = 1;
  public sourcesPath!: string;
  public testsPath!: string;
  public libPath!: string;
  public scriptPath!: string;
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
    return "Foundry";
  }

  public async initialize(): Promise<void> {
    this.initializeError = undefined; // clear any potential error on restart

    try {
      const forgeCommand = await this._resolveForgeCommand();
      const config = JSON.parse(
        await runCmd(`${forgeCommand} config --json`, this.basePath)
      );
      this.sourcesPath = path.join(this.basePath, config.src);
      this.testsPath = path.join(this.basePath, config.test);
      this.libPath = path.join(this.basePath, "lib");
      this.scriptPath = path.join(this.basePath, config.script);
      this.configSolcVersion = config.solc || undefined; // may come as null otherwise

      const rawRemappings = await runCmd(
        `${forgeCommand} remappings`,
        this.basePath
      );
      this.remappings = this._parseRemappings(rawRemappings);
    } catch (error: any) {
      this.serverState.logger.error(error.toString());

      switch (error.code) {
        case 134:
          this.initializeError =
            "Running `forge` failed. Please check that your foundry.toml file is correct.";
          break;
        case undefined:
          this.initializeError = `${error}`;
          break;
        default:
          this.initializeError = `Unexpected error while running \`forge\`: ${error}`;
      }
    }

    return;
  }

  public async fileBelongs(uri: string) {
    if (this.initializeError === undefined) {
      // Project was initialized correctly, then check contract is inside source or test folders
      const belongs = [
        this.sourcesPath,
        this.testsPath,
        this.libPath,
        this.scriptPath,
      ].some((dir) => directoryContains(dir, uri));
      const isLocal = directoryContains(this.sourcesPath, uri);

      return { belongs, isLocal };
    } else {
      // Project could not be initialized. Claim all files under base path to avoid them being incorrectly assigned to other projects
      return { belongs: directoryContains(this.basePath, uri), isLocal: true };
    }
  }

  public async resolveImportPath(file: string, importPath: string) {
    let transformedPath = importPath;

    // Apply remappings to importPath if it's not a relative import
    if (!importPath.startsWith(".")) {
      for (const { from, to } of this.remappings) {
        const toAbsolutePath = path.join(this.basePath, to);
        if (importPath.startsWith(from)) {
          transformedPath = path.join(
            toAbsolutePath,
            importPath.slice(from.length)
          );
        }
      }
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

    const sources = basicCompilation.input.sources;

    // Modify source keys to be root-relative instead of absolute
    // i,e, '/home/user/myProject/src/Contract.sol' => 'src/Contract.sol'
    for (const [sourceKey, sourceValue] of Object.entries(sources)) {
      const transformedSourceKey = path.relative(this.basePath, sourceKey);
      sources[transformedSourceKey] = sourceValue;
      delete sources[sourceKey];
    }

    const remappings = this.remappings.map(
      (remapping) => `${remapping.from}=${remapping.to}`
    );

    (basicCompilation.input.settings as any).remappings = remappings; // CompilerInput type doesn't have remappings

    return basicCompilation;
  }

  public async onWatchedFilesChanges({
    changes,
  }: DidChangeWatchedFilesParams): Promise<void> {
    for (const change of changes) {
      const remappingsPath = path.join(this.basePath, "remappings.txt");

      if ([this.configPath, remappingsPath].some((uri) => change.uri === uri)) {
        this.serverState.logger.info(
          `Reinitializing foundry project: ${this.id()}`
        );

        await this.initialize();
      }
    }
    return;
  }

  public getImportCompletions(
    position: Position,
    currentImport: string
  ): CompletionItem[] {
    return getImportCompletions(
      {
        project: this,
        solFileIndex: this.serverState.solFileIndex,
      },
      position,
      currentImport
    );
  }

  private _parseRemappings(rawRemappings: string) {
    const lines = rawRemappings.trim().split("\n");
    const remappings: Remapping[] = [];

    for (const line of lines) {
      const lineTokens = line.split("=", 2);

      if (
        lineTokens.length !== 2 ||
        lineTokens[0].length === 0 ||
        lineTokens[1].length === 0
      ) {
        continue;
      }

      const [from, to] = lineTokens.map((token) =>
        token.endsWith("/") ? token : `${token}/`
      );

      remappings.push({
        from,
        to,
      });
    }

    return remappings;
  }

  // Returns the forge binary path
  private async _resolveForgeCommand() {
    const potentialForgeCommands = ["forge"];

    if (runningOnWindows()) {
      potentialForgeCommands.push("%USERPROFILE%\\.cargo\\bin\\forge");
    } else {
      potentialForgeCommands.push("~/.foundry/bin/forge");
    }

    for (const potentialForgeCommand of potentialForgeCommands) {
      try {
        await runCmd(`${potentialForgeCommand} --version`);
        return potentialForgeCommand;
      } catch (error: any) {
        if (
          error.code === 127 || // unix
          error.toString().includes("is not recognized") || // windows (code: 1)
          error.toString().includes("cannot find the path") // windows (code: 1)
        ) {
          // command not found, then try the next potential command
          continue;
        } else {
          // command found but execution failed
          throw error;
        }
      }
    }

    throw new Error(
      `Couldn't find forge binary. Performed lookup: ${JSON.stringify(
        potentialForgeCommands
      )}`
    );
  }
}
