/* eslint-disable @typescript-eslint/no-explicit-any */
import fs from "fs";
import _ from "lodash";
import path from "path";
import { DidChangeWatchedFilesParams } from "vscode-languageserver-protocol";
import { OpenDocuments, ServerState } from "../../types";
import { toUnixStyle } from "../../utils";
import { directoryContains } from "../../utils/directoryContains";
import { runCmd, runningOnWindows } from "../../utils/operatingSystem";
import { CompilationDetails } from "../base/CompilationDetails";
import { Project } from "../base/Project";
import { buildBasicCompilation } from "../shared/buildBasicCompilation";
import { Remapping } from "./Remapping";

export class FoundryProject extends Project {
  public priority = 1;
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
    return "Foundry";
  }

  public async initialize(): Promise<void> {
    try {
      const forgePath = runningOnWindows()
        ? "%USERPROFILE%\\.cargo\\bin\\forge"
        : "~/.foundry/bin/forge";
      const config = JSON.parse(
        await runCmd(`${forgePath} config --json`, this.basePath)
      );
      this.sourcesPath = path.join(this.basePath, config.src);
      this.testsPath = path.join(this.basePath, config.test);
      this.configSolcVersion = config.solc || undefined; // may come as null otherwise

      const rawRemappings = await runCmd(
        `${forgePath} remappings`,
        this.basePath
      );
      this.remappings = this._parseRemappings(rawRemappings);
    } catch (error: any) {
      this.serverState.logger.error(error.toString());

      switch (error.code) {
        case 127:
          this.initializeError =
            "Couldn't run `forge`. Please check that your foundry installation is correct.";
          break;
        case 134:
          this.initializeError =
            "Running `forge` failed. Please check that your foundry.toml file is correct.";
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
      return [this.sourcesPath, this.testsPath].some((dir) =>
        directoryContains(dir, uri)
      );
    } else {
      // Project could not be initialized. Claim all files under base path to avoid them being incorrectly assigned to other projects
      return directoryContains(this.basePath, uri);
    }
  }

  public resolveImportPath(file: string, importPath: string) {
    try {
      let transformedPath = importPath;

      if (!importPath.startsWith(".")) {
        for (const { from, to } of this.remappings) {
          if (importPath.startsWith(from)) {
            transformedPath = path.join(to, importPath.slice(from.length));
          }
        }
      }
      const resolvedPath = require.resolve(transformedPath, {
        paths: [fs.realpathSync(path.dirname(file))],
      });

      return toUnixStyle(fs.realpathSync(resolvedPath));
    } catch (error) {
      return undefined;
    }
  }

  public async buildCompilation(
    sourceUri: string,
    openDocuments: OpenDocuments
  ): Promise<CompilationDetails> {
    if (this.initializeError !== undefined) {
      throw new Error(this.initializeError);
    }

    const basicCompilation = await buildBasicCompilation(
      this,
      sourceUri,
      openDocuments,
      this.configSolcVersion
    );

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

      remappings.push({ from, to: path.join(this.basePath, to) });
    }

    return remappings;
  }
}
