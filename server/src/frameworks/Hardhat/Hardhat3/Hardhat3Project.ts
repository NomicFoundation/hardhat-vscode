import _ from "lodash";
import path from "path";
import {
  CodeAction,
  CompletionItem,
  Diagnostic,
  DidChangeWatchedFilesParams,
  FileChangeType,
  Position,
} from "vscode-languageserver-protocol";
import { TextDocument } from "vscode-languageserver-textdocument";
import { createRequire } from "module";
import type { HardhatRuntimeEnvironment } from "hardhat3/types/hre" with { "resolution-mode": "import" };
import type { HardhatUserConfig } from "hardhat3/types/config" with { "resolution-mode": "import" };
import type { HardhatPlugin } from "hardhat3/types/plugins" with { "resolution-mode": "import" };
import type { HookContext } from "hardhat3/types/hooks" with { "resolution-mode": "import" };
import { pathToFileURL } from "url";
import {
  BuildInputError,
  FileSpecificError,
  InitializationFailedError,
} from "../../base/Errors";
import { directoryContains } from "../../../utils/directoryContains";
import { CompilationDetails } from "../../base/CompilationDetails";
import { FileBelongsResult, Project } from "../../base/Project";
import { Logger } from "../../../utils/Logger";
import { OpenDocuments, ServerState } from "../../../types";
import { LSPDependencyGraph } from "./LSPDependencyGraph";
import { toPath } from "../../../utils/paths";
import { analyze } from "@nomicfoundation/solidity-analyzer";
import { resolveActionsFor } from "../Hardhat2/resolveActionsFor";
import { isModuleNotFoundError } from "../../../utils/errors";
import { findUpSync } from "../../../parser/common/utils";
import promises from "node:fs/promises";

export class Hardhat3Project extends Project {
  public priority = 5;

  protected logger: Logger;
  protected initializeError?: string;
  protected hre?: HardhatRuntimeEnvironment;
  protected dependencyGraph?: LSPDependencyGraph;
  protected openDocuments: OpenDocuments = [];
  protected importsCache: Map<string, string> = new Map<string, string>();

  constructor(
    serverState: ServerState,
    basePath: string,
    public configPath: string
  ) {
    super(serverState, basePath);
    this.logger = _.clone(serverState.logger);
    this.logger.tag = path.basename(basePath);
  }

  public id(): string {
    return this.configPath;
  }

  public frameworkName(): string {
    return "Hardhat 3";
  }

  public async initialize(): Promise<void> {
    this.initializeError = undefined; // clear any potential error on restart

    try {
      // Load the importUserConfig function from the local installation
      // const { importUserConfig,ResolverImplementation, readSourceFileFactory } = await this.#importLocalNpmModule("hardhat/lsp-helpers");
      const { importUserConfig } = await this.#importLocalNpmModule(
        "dist/src/internal/config-loading.js"
      );
      const { ResolverImplementation } = await this.#importLocalNpmModule(
        "dist/src/internal/builtin-plugins/solidity/build-system/resolver/dependency-resolver.js"
      );

      // hack fs promises
      const realReadFile = promises.readFile;
      promises.readFile = (async (absPath: string, options: any) => {
        for (const openDocument of this.openDocuments) {
          if (openDocument.uri === absPath) {
            return openDocument.documentText;
          }
        }
        return realReadFile(absPath, options);
      }) as any;

      // Load the hardhat config file
      let config: HardhatUserConfig;
      try {
        config = await importUserConfig(this.configPath);
      } catch (error) {
        this.logger.error(error);
        this.initializeError = `Couldn't load the project config file. Please make sure the config file is valid.`;
        return;
      }

      // Load the createHardhatRuntimeEnvironment function from the local installation
      // const { createHardhatRuntimeEnvironment } = await this.#importLocalNpmModule("hardhat/hre");
      const { createHardhatRuntimeEnvironment } =
        await this.#importLocalNpmModule("dist/src/hre.js");

      // Add ad-hoc plugin to override file reading
      const _this = this;
      config.plugins ||= [];
      config.plugins.push({
        id: "hardhatVscode",
        hookHandlers: {
          solidity: async () => ({
            async readSourceFile(
              context: HookContext,
              absolutePath: string,
              next: (
                nextContext: HookContext,
                absolutePath: string
              ) => Promise<string>
            ) {
              for (const openDocument of _this.openDocuments) {
                if (openDocument.uri === absolutePath) {
                  return openDocument.documentText;
                }
              }

              return next(context, absolutePath);
            },
          }),
        },
      } as HardhatPlugin);

      // Create the Hardhat Runtime Environment
      try {
        this.hre = (await createHardhatRuntimeEnvironment(
          config,
          { config: this.configPath },
          this.basePath
        )) as HardhatRuntimeEnvironment;
      } catch (error) {
        this.logger.error(error);
        this.initializeError = `Couldn't create the Hardhat Runtime Environment. See the logs for more details.`;
        return;
      }

      // Create the dependency graph
      // const readSourceFile = readSourceFileFactory(this.hre!.hooks);

      const resolverFactory = async () =>
        ResolverImplementation.create(
          this.basePath,
          this.hre!.config.solidity.remappings
          // readSourceFile
        );

      this.dependencyGraph = new LSPDependencyGraph(resolverFactory);
    } catch (error) {
      this.logger.error(error);

      if (isModuleNotFoundError(error)) {
        this.initializeError = `Couldn't load the local installation of hardhat 3. Make sure packages are installed.`;
      } else if (error instanceof Error) {
        this.initializeError = error.message;
      } else {
        this.initializeError = JSON.stringify(error);
      }
    }
  }

  public async fileBelongs(sourceURI: string): Promise<FileBelongsResult> {
    const belongs = directoryContains(this.basePath, sourceURI);
    let isLocal = false;

    if (this.hre !== undefined) {
      const sourcesPath = this.hre.config.paths.sources.solidity;
      for (const sourcePath of sourcesPath) {
        if (directoryContains(sourcePath, sourceURI)) {
          isLocal = true;
          break;
        }
      }
    }

    return { belongs, isLocal };
  }

  public async buildCompilation(
    sourceUri: string,
    openDocuments: OpenDocuments
  ): Promise<CompilationDetails> {
    this.openDocuments = openDocuments;

    // Ensure project is initialized
    if (this.initializeError !== undefined) {
      const error: InitializationFailedError = {
        _isInitializationFailedError: true,
        error: this.initializeError,
      };

      throw error;
    }

    if (this.hre === undefined) {
      throw new Error("hre not initialized");
    }

    const relativePath = path.relative(this.basePath, sourceUri);

    if (relativePath.includes("node_modules")) {
      throw new Error("Validation on dependencies is not supported yet");
    }

    try {
      const compilationJobs = await this.hre.solidity.getCompilationJobs([
        sourceUri,
      ]);

      if ("reason" in compilationJobs) {
        throw new Error(`Error getting compilation job: ${JSON.stringify(compilationJobs, null, 2) }`);
      }

      const compilationJob = compilationJobs.values().next().value!;
      const compilerInput = compilationJob.getSolcInput();

      return {
        solcVersion: compilationJob.solcConfig.version,
        input: compilerInput,
      };
    } catch (error) {
      this.logger.error(error)
      const { HardhatError } = await import("@nomicfoundation/hardhat-errors");

      if (!HardhatError.isHardhatError(error)) {
        throw error;
      }

      const buildError: BuildInputError = {
        _isBuildInputError: true,
        fileSpecificErrors: {},
        projectWideErrors: [],
      };

      // Handle import-related error
      const importErrorTypes = [
        HardhatError.ERRORS.CORE.SOLIDITY.IMPORTED_FILE_DOESNT_EXIST,
        HardhatError.ERRORS.CORE.SOLIDITY.IMPORTED_FILE_WITH_INCORRECT_CASING,
        HardhatError.ERRORS.CORE.SOLIDITY
          .IMPORTED_PACKAGE_EXPORTS_FILE_WITH_INCORRECT_CASING,
        HardhatError.ERRORS.CORE.SOLIDITY.IMPORTED_NPM_DEPENDENCY_NOT_INSTALLED,
        HardhatError.ERRORS.CORE.SOLIDITY.INVALID_NPM_IMPORT,
        HardhatError.ERRORS.CORE.SOLIDITY.ILLEGAL_PACKAGE_IMPORT,
        HardhatError.ERRORS.CORE.SOLIDITY.ILEGALL_PROJECT_IMPORT,
        HardhatError.ERRORS.CORE.SOLIDITY
          .ILLEGAL_PROJECT_IMPORT_AFTER_REMAPPING,
        HardhatError.ERRORS.CORE.SOLIDITY.IMPORT_PATH_WITH_WINDOWS_SEPARATOR,
      ];

      for (const importErrorType of importErrorTypes) {
        if (HardhatError.isHardhatError(error, importErrorType)) {
          const messageArguments = error.messageArguments as {
            from?: string;
            importPath?: string;
          };

          // invariant check
          if (!messageArguments.from || !messageArguments.importPath) {
            this.logger.error(
              `Expected hardhart import error to have 'from' and 'importPath': ${JSON.stringify(error, null, 2)}`
            );
            throw error;
          }

          const fileSpecificError: FileSpecificError = {
            error: {
              message: error.message,
              source: "hardhat",
              type: "import",
              code: error.descriptor.number,
            },
          };

          // The 'from' path included in the error is relative to cwd instead of project root
          const fromAbsPath = path.join(process.cwd(), messageArguments.from);

          const openDocument = openDocuments.find((d) => d.uri === fromAbsPath);

          if (openDocument) {
            fileSpecificError.startOffset = openDocument.documentText.indexOf(
              messageArguments.importPath
            );
            fileSpecificError.endOffset =
              fileSpecificError.startOffset +
              messageArguments.importPath.length;
          }

          buildError.fileSpecificErrors[fromAbsPath] ||= [];
          buildError.fileSpecificErrors[fromAbsPath].push(fileSpecificError);

          throw buildError;
        }
      }

      // Handle non-import related error
      buildError.projectWideErrors.push({
        type: "general",
        message: error.message,
        source: "hardhat",
        code: error.descriptor.number,
      });

      throw buildError;
    }
  }

  public async onWatchedFilesChanges({
    changes,
  }: DidChangeWatchedFilesParams): Promise<void> {
    this.#assertDependencyGraphInitialized();
    for (const change of changes) {
      const relativePath = path.relative(this.basePath, toPath(change.uri));

      if (relativePath.includes("node_modules")) {
        continue; // dont walk dependencies as roots
      }

      try {
        switch (change.type) {
          case FileChangeType.Created:
            console.log(`Created ${change.uri}`);
            await this.dependencyGraph.walkFile(toPath(change.uri));
            await this.dependencyGraph.addNewFile(toPath(change.uri));
            break;
          case FileChangeType.Changed: // When changed by external program
            console.log(`Changed ${change.uri}`);
            await this.dependencyGraph.walkFile(toPath(change.uri));
            break;
          case FileChangeType.Deleted:
            console.log(`Deleted ${change.uri}`);
            await this.dependencyGraph.deleteFile(toPath(change.uri));
            break;
        }
      } catch (error) {
        this.logger.error(error);
      }
    }
  }

  public async resolveImportPath(from: string, importPath: string) {
    if (this.dependencyGraph === undefined) {
      console.error("dependency graph not initialized");
      return undefined;
    }

    return this.dependencyGraph.resolveImport(from, importPath);
  }

  public async preAnalyze(absPath: string, text: string) {
    if (this.dependencyGraph === undefined) {
      return;
    }

    const relativePath = path.relative(this.basePath, absPath);
    if (relativePath.includes("node_modules")) {
      return; // dont walk dependencies as roots
    }

    const { imports } = analyze(text);
    const importsDigest = imports.join();

    // If imports didn't change, don't modify the dependency graph
    if (this.importsCache.get(absPath) === importsDigest) {
      return;
    }

    await this.dependencyGraph.walkFile(absPath);

    this.importsCache.set(absPath, importsDigest);
  }

  public invalidateBuildCache() {}

  public getImportCompletions(
    position: Position,
    currentImport: string
  ): CompletionItem[] {
    return [];
  }

  public resolveActionsFor(
    diagnostic: Diagnostic,
    document: TextDocument,
    uri: string
  ): CodeAction[] {
    return resolveActionsFor(this.serverState, diagnostic, document, uri);
  }

  // Import a project's local package dynamically
  // async #importLocalNpmModule(npmModule: string) {
  //   const require = createRequire(this.configPath);

  //   const modulePath = require.resolve(npmModule, {
  //     paths: [this.basePath],
  //   });

  //   return await import(modulePath);
  // }
  async #importLocalNpmModule(hardhatSubpath: string) {
    const require = createRequire(this.configPath);

    // const modulePath = require.resolve(hardhatSubpath, {
    //   paths: [this.basePath],
    // });

    const rootHardhatPath = require.resolve("hardhat", {
      paths: [this.basePath],
    });


    const hardhatPackageJsonPath = findUpSync("package.json", {
      cwd: path.dirname(rootHardhatPath),
      fullPath: true,
    });


    if (!hardhatPackageJsonPath) {
      throw new Error(
        `Couldn't find package.json for hardhat starting from ${rootHardhatPath}`
      );
    }

    const hardhatRootPath = path.dirname(hardhatPackageJsonPath);


    const modulePath = path.join(hardhatRootPath, hardhatSubpath);


    return await import(modulePath);
  }

  #assertHreInitialized(): asserts this is { hre: HardhatRuntimeEnvironment } {
    if (this.hre === undefined) {
      throw new Error("hre not initialized");
    }
  }

  #assertDependencyGraphInitialized(): asserts this is {
    dependencyGraph: LSPDependencyGraph;
    hre: HardhatRuntimeEnvironment;
  } {
    this.#assertHreInitialized();
    if (this.dependencyGraph === undefined) {
      throw new Error("Dependency graph not initialized");
    }
  }
}
