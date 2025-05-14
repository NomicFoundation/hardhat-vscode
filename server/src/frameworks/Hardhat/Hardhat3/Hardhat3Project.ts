import _ from "lodash";
import path from "path";
import {
  CodeAction,
  CompletionItem,
  Diagnostic,
  DidChangeWatchedFilesParams,
  FileChangeType,
  FileEvent,
  Position,
} from "vscode-languageserver-protocol";
import { TextDocument } from "vscode-languageserver-textdocument";
import { createRequire } from "module";
import type { HardhatRuntimeEnvironment } from "hardhat3/types/hre" with { "resolution-mode": "import" };
import type { HardhatUserConfig } from "hardhat3/types/config" with { "resolution-mode": "import" };
import type { HookContext } from "hardhat3/types/hooks" with { "resolution-mode": "import" };
import { analyze } from "@nomicfoundation/solidity-analyzer";
import { cpSync } from "fs";
import { removeSync } from "fs-extra";
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
import {
  normalizeAbsolutePath,
  pathsEqual,
  toPath,
} from "../../../utils/paths";
import { resolveActionsFor } from "../Hardhat2/resolveActionsFor";
import { isModuleNotFoundError } from "../../../utils/errors";
import {
  isTestMode,
  lowercaseDriveLetter,
  toUnixStyle,
  toUri,
} from "../../../utils";
import { normalizedCwd } from "../../../utils/operatingSystem";
import { LSPDependencyGraph } from "./LSPDependencyGraph";

export class Hardhat3Project extends Project {
  public priority = 5;

  protected logger: Logger;
  protected initializeError?: string; // Any error message that happened during initialization
  protected hre?: HardhatRuntimeEnvironment; // HRE instance of this project
  protected dependencyGraph?: LSPDependencyGraph; // Dependency graph built/maintained for import resolution on analysis
  protected importsCache: Map<string, string> = new Map<string, string>(); // Absolute path => imports digest map. To optimize dependency graph building
  public configPath;

  constructor(serverState: ServerState, basePath: string, configPath: string) {
    const normalizedBasePath = normalizeAbsolutePath(basePath);
    const normalizedConfigPath = normalizeAbsolutePath(configPath);

    super(serverState, normalizedBasePath);
    this.logger = _.clone(serverState.logger);
    this.logger.tag = path.basename(normalizedBasePath);
    this.configPath = normalizedConfigPath;
  }

  public id(): string {
    return this.configPath;
  }

  public frameworkName(): string {
    return "Hardhat 3";
  }

  public async initialize(): Promise<void> {
    this.initializeError = undefined; // clear any potential error on restart
    this.importsCache.clear(); // clear the import cache

    try {
      // Import necessary functions and classes from project's local hardhat3 installation
      const { ResolverImplementation, readSourceFileFactory } =
        await this.#importLocalNpmModule("hardhat/internal/lsp-helpers");
      const { importUserConfig, createHardhatRuntimeEnvironment } =
        await this.#importLocalNpmModule("hardhat/hre");

      // Load the hardhat config file. Make an ephemeral copy to avoid caching that would prevent reloading
      let config: HardhatUserConfig;
      const tmpConfigPath = path.join(
        path.dirname(this.configPath),
        `.vscode_hardhat_config_${new Date().getTime()}.ts`
      );
      try {
        cpSync(this.configPath, tmpConfigPath);
        config = await importUserConfig(tmpConfigPath);
      } catch (error) {
        this.logger.error(error);
        this.initializeError = `Couldn't load the project config file. Please make sure the config file is valid.`;
        return;
      } finally {
        removeSync(tmpConfigPath);
      }

      // Add ad-hoc plugin to override file reading
      config.plugins ||= [];
      config.plugins.push({
        id: "hardhatVscode",
        hookHandlers: {
          solidity: async () => ({
            readSourceFile: async (
              context: HookContext,
              absolutePath: string,
              next: (
                nextContext: HookContext,
                absolutePath: string
              ) => Promise<string>
            ) => {
              const doc = this.serverState.documents.get(toUri(absolutePath));

              if (doc !== undefined) {
                return doc.getText();
              }

              return next(context, absolutePath);
            },
          }),
        },
      });

      // Create the Hardhat Runtime Environment
      this.hre = (await createHardhatRuntimeEnvironment(
        config,
        { config: this.configPath },
        this.basePath
      )) as HardhatRuntimeEnvironment;

      // Create the dependency graph
      const readSourceFile = readSourceFileFactory(this.hre!.hooks);
      const resolverFactory = async () =>
        // This is so the dependency graph can get a new resolver instance whenever it needs to
        ResolverImplementation.create(
          this.basePath,
          this.hre!.config.solidity.remappings,
          readSourceFile
        );

      this.dependencyGraph = new LSPDependencyGraph(resolverFactory);

      // Download all required compilers
      await this.hre.solidity.getCompilationJobs([]);
    } catch (error) {
      this.logger.error(error);

      if (isModuleNotFoundError(error)) {
        this.initializeError = `Couldn't load the local installation of hardhat 3. Make sure packages are installed.`;
      } else if (error instanceof Error) {
        this.initializeError = error.message;
      } else {
        this.initializeError = JSON.stringify(error);
      }
    } finally {
      // Notify that the project was initialized
      if (isTestMode()) {
        await this.serverState.connection.sendNotification(
          "custom/projectInitialized",
          { configPath: this.configPath }
        );
      }
    }
  }

  public async fileBelongs(sourceURI: string): Promise<FileBelongsResult> {
    // Any solidity file under this project's root path is considered to belong to this project
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
    const absolutePath = normalizeAbsolutePath(sourceUri);

    // Ensure project is initialized correctly
    if (this.initializeError !== undefined) {
      const error: InitializationFailedError = {
        _isInitializationFailedError: true,
        error: this.initializeError,
      };

      throw error;
    }

    if (this.hre === undefined) {
      throw new Error("HRE not initialized");
    }

    const relativePath = path.relative(this.basePath, absolutePath);

    if (relativePath.includes("node_modules")) {
      throw new Error("Validation on dependencies is not supported yet");
    }

    try {
      const compilationJobs = await this.hre.solidity.getCompilationJobs([
        absolutePath,
      ]);

      if ("reason" in compilationJobs) {
        throw new Error(
          `Error getting compilation job: ${JSON.stringify(compilationJobs, null, 2)}`
        );
      }

      const compilationJob = compilationJobs.values().next().value!;

      const compilerInput = await compilationJob.getSolcInput();

      return {
        solcVersion: compilationJob.solcConfig.version,
        input: compilerInput,
      };
    } catch (error) {
      const { HardhatError } = await import("@nomicfoundation/hardhat3-errors");

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
          if (
            messageArguments.from === undefined ||
            messageArguments.importPath === undefined
          ) {
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
          const fromAbsPath = path.join(normalizedCwd(), messageArguments.from);

          const openDocument = openDocuments.find((d) =>
            pathsEqual(d.uri, fromAbsPath)
          );

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
      this.logger.error(error);

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
    for (const change of changes) {
      if (pathsEqual(toPath(change.uri), this.configPath)) {
        await this.#handleConfigChange();
      } else if (change.uri.endsWith(".sol")) {
        await this.#handleSourceFileChange(change);
      }
    }
  }

  async #handleConfigChange() {
    await this.initialize();
  }

  async #handleSourceFileChange(change: FileEvent) {
    const relativePath = path.relative(this.basePath, toPath(change.uri));

    if (relativePath.includes("node_modules")) {
      return; // dont walk dependencies as roots
    }

    try {
      this.#assertDependencyGraphInitialized();

      switch (change.type) {
        case FileChangeType.Created:
          this.logger.trace(`Created ${change.uri}`);
          await this.dependencyGraph.addNewFile(toPath(change.uri));
          break;
        case FileChangeType.Changed: // When changed by external program
          this.logger.trace(`Changed ${change.uri}`);
          await this.dependencyGraph.walkFile(toPath(change.uri));
          break;
        case FileChangeType.Deleted:
          this.logger.trace(`Deleted ${change.uri}`);
          await this.dependencyGraph.deleteFile(toPath(change.uri));
          break;
      }
    } catch (error) {
      this.logger.error(error);
    }
  }

  public async resolveImportPath(from: string, importPath: string) {
    if (this.dependencyGraph === undefined) {
      this.logger.info(
        "Can't resolve import path because the dependency graph is not initialized"
      );
      return undefined;
    }

    const normalizedFrom = normalizeAbsolutePath(from);

    const resolvedAbsolutePath = this.dependencyGraph.resolveImport(
      normalizedFrom,
      importPath
    );

    if (resolvedAbsolutePath !== undefined) {
      return lowercaseDriveLetter(toUnixStyle(resolvedAbsolutePath));
    }
  }

  public async preAnalyze(absPath: string, text: string) {
    if (this.dependencyGraph === undefined) {
      return;
    }

    const normalizedAbsPath = normalizeAbsolutePath(absPath);

    const relativePath = path.relative(this.basePath, normalizedAbsPath);
    if (relativePath.includes("node_modules")) {
      return; // dont walk dependencies as roots
    }

    const { imports } = analyze(text);
    const importsDigest = imports.join();

    // If imports didn't change, don't modify the dependency graph
    if (this.importsCache.get(normalizedAbsPath) === importsDigest) {
      return;
    }

    await this.dependencyGraph.walkFile(normalizedAbsPath);

    this.importsCache.set(normalizedAbsPath, importsDigest);
  }

  public invalidateBuildCache() {
    return;
  }

  public getImportCompletions(
    _position: Position,
    _currentImport: string
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
  async #importLocalNpmModule(npmModule: string) {
    const require = createRequire(this.configPath);

    const modulePath = require.resolve(npmModule, {
      paths: [this.basePath],
    });

    return import(toUri(modulePath));
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
