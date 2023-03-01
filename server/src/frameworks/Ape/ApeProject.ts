/* eslint-disable @typescript-eslint/no-explicit-any */

import { readFileSync } from "fs";
import _ from "lodash";
import path from "path";
import {
  CompletionItem,
  DidChangeWatchedFilesParams,
  Position,
} from "vscode-languageserver-protocol";
import YAML from "yaml";
import { OpenDocuments, ServerState } from "../../types";
import { CompilationDetails } from "../base/CompilationDetails";
import { FileBelongsResult, Project } from "../base/Project";
import { parseRemappingLine, Remapping } from "../base/Remapping";
import { buildBasicCompilation } from "../shared/buildBasicCompilation";
import { ApeConfig } from "./types";

export class ApeProject extends Project {
  public priority = 0;
  public sourcesPath!: string;
  public dependenciesPath!: string;
  public remappings: Remapping[] = [];
  public initializeError?: string;
  public configSolcVersion?: string;
  public config!: ApeConfig;

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
      this.config = YAML.parse(configContent);

      this.configSolcVersion = this.config?.solidity?.version;
      this.sourcesPath = this.config?.contracts_folder ?? "contracts";
      this.dependenciesPath = path.join(this.sourcesPath, ".cache");

      const configRemappings = this.config?.solidity?.import_remapping ?? [];

      this.remappings = _.compact(configRemappings.map(parseRemappingLine));

      console.log(JSON.stringify(this.configSolcVersion, null, 2));
      console.log(JSON.stringify(this.sourcesPath, null, 2));
      console.log(JSON.stringify(this.remappings, null, 2));
    } catch (error) {
      this.initializeError = `${error}`;
      this.serverState.logger.error(this.initializeError);
    }

    return;
  }

  public async fileBelongs(uri: string): Promise<FileBelongsResult> {
    // if (this.initializeError === undefined) {
    //   // Project was initialized correctly, then check contract is inside source or test folders
    //   const belongs = [
    //     this.sourcesPath,
    //     this.testsPath,
    //     this.libPath,
    //     this.scriptPath,
    //   ].some((dir) => directoryContains(dir, uri));
    //   const isLocal = directoryContains(this.sourcesPath, uri);

    //   return { belongs, isLocal };
    // } else {
    //   // Project could not be initialized. Claim all files under base path to avoid them being incorrectly assigned to other projects
    //   return { belongs: directoryContains(this.basePath, uri), isLocal: true };
    // }

    return { belongs: false, isLocal: false };
  }

  public async resolveImportPath(file: string, importPath: string) {
    // let transformedPath = importPath;

    // // Apply remappings to importPath if it's not a relative import
    // if (!importPath.startsWith(".")) {
    //   for (const { from, to } of this.remappings) {
    //     const toAbsolutePath = path.join(this.basePath, to);
    //     if (importPath.startsWith(from)) {
    //       transformedPath = path.join(
    //         toAbsolutePath,
    //         importPath.slice(from.length)
    //       );
    //     }
    //   }
    // }

    // // Try to resolve the import recursively, start from source directory up to project root
    // let testBaseDirectory = path.dirname(file);
    // let resolvedPath: string | undefined;

    // while (directoryContains(this.basePath, testBaseDirectory)) {
    //   const testResolvedPath = path.resolve(testBaseDirectory, transformedPath);

    //   if (existsSync(testResolvedPath)) {
    //     resolvedPath = testResolvedPath;
    //     break;
    //   }

    //   testBaseDirectory = path.dirname(testBaseDirectory);
    // }

    // return resolvedPath !== undefined ? toUnixStyle(resolvedPath) : undefined;

    return undefined;
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

    // const sources = basicCompilation.input.sources;

    // // Modify source keys to be root-relative instead of absolute
    // // i,e, '/home/user/myProject/src/Contract.sol' => 'src/Contract.sol'
    // for (const [sourceKey, sourceValue] of Object.entries(sources)) {
    //   const transformedSourceKey = path.relative(this.basePath, sourceKey);
    //   sources[transformedSourceKey] = sourceValue;
    //   delete sources[sourceKey];
    // }

    // const remappings = this.remappings.map(
    //   (remapping) => `${remapping.from}=${remapping.to}`
    // );

    // (basicCompilation.input.settings as any).remappings = remappings; // CompilerInput type doesn't have remappings

    return basicCompilation;
  }

  public async onWatchedFilesChanges({
    changes,
  }: DidChangeWatchedFilesParams): Promise<void> {
    // for (const change of changes) {
    //   const remappingsPath = path.join(this.basePath, "remappings.txt");
    //   if ([this.configPath, remappingsPath].some((uri) => change.uri === uri)) {
    //     this.serverState.logger.info(
    //       `Reinitializing Ape project: ${this.id()}`
    //     );
    //     await this.initialize();
    //   }
    // }
    // return;
  }

  public getImportCompletions(
    position: Position,
    currentImport: string
  ): CompletionItem[] {
    // return getImportCompletions(
    //   {
    //     project: this,
    //     solFileIndex: this.serverState.solFileIndex,
    //   },
    //   position,
    //   currentImport
    // );
    return [];
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
    //   const potentialForgeCommands = ["forge"];
    //   if (runningOnWindows()) {
    //     potentialForgeCommands.push("%USERPROFILE%\\.cargo\\bin\\forge");
    //   } else {
    //     potentialForgeCommands.push("~/.Ape/bin/forge");
    //   }
    //   for (const potentialForgeCommand of potentialForgeCommands) {
    //     try {
    //       await runCmd(`${potentialForgeCommand} --version`);
    //       return potentialForgeCommand;
    //     } catch (error: any) {
    //       if (
    //         error.code === 127 || // unix
    //         error.toString().includes("is not recognized") || // windows (code: 1)
    //         error.toString().includes("cannot find the path") // windows (code: 1)
    //       ) {
    //         // command not found, then try the next potential command
    //         continue;
    //       } else {
    //         // command found but execution failed
    //         throw error;
    //       }
    //     }
    //   }
    //   throw new Error(
    //     `Couldn't find forge binary. Performed lookup: ${JSON.stringify(
    //       potentialForgeCommands
    //     )}`
    //   );
  }
}
