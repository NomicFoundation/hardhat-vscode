/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { AnalysisResult, analyze } from "@nomicfoundation/solidity-analyzer";
import {
  ActionType,
  CompilationJob,
  HardhatRuntimeEnvironment,
} from "hardhat/types";
import path from "path";
import { isDeepStrictEqual } from "util";
import {
  TASK_COMPILE_SOLIDITY_GET_COMPILATION_JOB_FOR_FILE,
  TASK_COMPILE_SOLIDITY_GET_COMPILER_INPUT,
  TASK_COMPILE_SOLIDITY_GET_DEPENDENCY_GRAPH,
  TASK_COMPILE_SOLIDITY_GET_SOURCE_NAMES,
  TASK_COMPILE_SOLIDITY_GET_SOURCE_PATHS,
  TASK_COMPILE_SOLIDITY_READ_FILE,
} from "hardhat/builtin-tasks/task-names";
import { SolidityFilesCache } from "hardhat/builtin-tasks/utils/solidity-files-cache";
import { HardhatError } from "hardhat/internal/core/errors";
import { CompilationDetails } from "../../base/CompilationDetails";
import { toUnixStyle, uriEquals } from "../../../utils";
import { directoryContains } from "../../../utils/directoryContains";
import { BuildInputError } from "../../base/Errors";
import { WorkerLogger } from "./WorkerLogger";
import {
  BuildCompilationRequest,
  BuildCompilationResponse,
  ErrorResponseMessage,
  FileBelongsRequest,
  FileBelongsResponse,
  InitializationFailureMessage,
  Message,
  MessageType,
} from "./WorkerProtocol";

delete process.env.HARDHAT_CONFIG; // remove hack from parent process

export class WorkerProcess {
  private logger: WorkerLogger;

  private hre!: HardhatRuntimeEnvironment;
  private solidityFilesCache!: typeof SolidityFilesCache;
  private solidityFilesCachePath!: string;
  private originalReadFileAction!: ActionType<{ absolutePath: string }>;

  // private resolvedFiles?: { [sourcePath: string]: ResolvedFile };

  private lastAnalyzedDocUri?: string;
  private lastAnalysis?: AnalysisResult;
  private lastCompilationDetails?: CompilationDetails;

  constructor() {
    this.logger = new WorkerLogger(this);
  }

  public async start() {
    process.on("message", async (msg) => {
      try {
        await this._handleMessage(msg);
      } catch (error: any) {
        const errorData = error instanceof Error ? error.message : error;

        if (msg.requestId) {
          await this.send(new ErrorResponseMessage(msg.requestId, errorData));
        }
      }
    });

    try {
      this._loadHRE();
    } catch (err: any) {
      this.logger.error(`Error loading HRE: ${err}`);
      let errorMessage;
      if (err.message.includes("Cannot find module 'hardhat'")) {
        errorMessage =
          "Couldn't find local hardhat module. Make sure project dependencies are installed.";
      } else {
        errorMessage = err.message;
      }
      await this.send(new InitializationFailureMessage(errorMessage));
      process.exit(1);
    }

    await this.send({ type: MessageType.INITIALIZED });
  }

  private _loadHRE() {
    const hardhatBase = path.resolve(
      require.resolve("hardhat", { paths: [process.cwd()] }),
      "..",
      "..",
      ".."
    );

    require(`${hardhatBase}/register.js`);

    // Load project's local HRE through require
    this.hre = require(`${hardhatBase}/internal/lib/hardhat-lib.js`);

    // Load local cache through require
    const cacheModule = require(`${hardhatBase}/builtin-tasks/utils/solidity-files-cache`);

    this.solidityFilesCachePath = cacheModule.getSolidityFilesCachePath(
      this.hre.config.paths
    );
    this.solidityFilesCache = cacheModule.SolidityFilesCache;

    // Store original READ_FILE action, which we override
    this.originalReadFileAction =
      this.hre.tasks[TASK_COMPILE_SOLIDITY_READ_FILE].action;
  }

  private async _handleMessage(msg: Message) {
    switch (msg.type) {
      case MessageType.FILE_BELONGS_REQUEST:
        await this._handleFileBelongs(msg as FileBelongsRequest);
        break;
      case MessageType.BUILD_COMPILATION_REQUEST:
        await this._handleCompilationRequest(msg as BuildCompilationRequest);
        break;
      case MessageType.INVALIDATE_BUILD_CACHE:
        this._handleInvalidateCache();
        break;
      default:
        break;
    }
  }
  private _handleInvalidateCache() {
    this._clearBuildCache();
  }

  private _clearBuildCache() {
    this.lastAnalysis = undefined;
    this.lastCompilationDetails = undefined;
    this.lastAnalyzedDocUri = undefined;
  }

  private async _handleFileBelongs({ requestId, uri }: FileBelongsRequest) {
    const sourcesPath = this.hre.config.paths.sources;
    const nodeModulesPath = path.join(
      this.hre.config.paths.root,
      "node_modules"
    );
    const belongs =
      directoryContains(sourcesPath, uri) ||
      directoryContains(nodeModulesPath, uri);

    await this.send(new FileBelongsResponse(requestId, belongs));
  }

  private async _handleCompilationRequest(request: BuildCompilationRequest) {
    // Send solc input back to LSP
    const compilationDetails = await this._getCompilationDetails(request);
    await this.send(
      new BuildCompilationResponse(request.requestId, compilationDetails)
    );
  }

  private async _getCompilationDetails(
    request: BuildCompilationRequest
  ): Promise<CompilationDetails> {
    const { sourceUri, openDocuments } = request;

    // Check source file to build is included in openDocuments
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

    try {
      // Analyze imports
      const analysis = analyze(documentText);

      // Avoid rebuilding dependency graph. If imports didnt change, just update open documents' contents
      if (
        sourceUri === this.lastAnalyzedDocUri &&
        isDeepStrictEqual(analysis, this.lastAnalysis) &&
        this.lastCompilationDetails !== undefined
      ) {
        for (const openDocument of openDocuments) {
          const normalizedUri = toUnixStyle(openDocument.uri);
          const sourceName = Object.keys(
            this.lastCompilationDetails.input.sources
          ).find((k) => normalizedUri.endsWith(k));

          if (sourceName !== undefined) {
            this.lastCompilationDetails.input.sources[sourceName] = {
              content: openDocument.documentText,
            };
          }
        }
        return this.lastCompilationDetails;
      }

      // Override task
      this.hre.tasks[TASK_COMPILE_SOLIDITY_READ_FILE].setAction(
        async (
          args: { absolutePath: string },
          hre: HardhatRuntimeEnvironment,
          runSuper
        ) => {
          const uri = toUnixStyle(args.absolutePath);

          const openDoc = openDocuments.find((doc) => doc.uri === uri);

          if (openDoc !== undefined) {
            return openDoc.documentText;
          }

          return this.originalReadFileAction(args, hre, runSuper);
        }
      );

      const sourcePaths = await this.hre.run(
        TASK_COMPILE_SOLIDITY_GET_SOURCE_PATHS
      );

      const sourceNames = (
        await this.hre.run(TASK_COMPILE_SOLIDITY_GET_SOURCE_NAMES, {
          sourcePaths,
        })
      ).filter((sourceName: string) => sourceUri.endsWith(sourceName));

      const solidityFilesCache = await this.solidityFilesCache.readFromFile(
        this.solidityFilesCachePath
      );

      const dependencyGraph = await this.hre.run(
        TASK_COMPILE_SOLIDITY_GET_DEPENDENCY_GRAPH,
        { sourceNames, solidityFilesCache }
      );

      const file = dependencyGraph
        .getResolvedFiles()
        .filter((f: { absolutePath: string }) =>
          uriEquals(toUnixStyle(f.absolutePath), sourceUri)
        )[0];

      if (file === undefined) {
        throw new Error(
          `File ${sourceUri} not found in sourceNames ${sourceNames}`
        );
      }

      const compilationJob = await this.hre.run(
        TASK_COMPILE_SOLIDITY_GET_COMPILATION_JOB_FOR_FILE,
        {
          file,
          dependencyGraph,
        }
      );

      if (compilationJob.reason) {
        this.logger.trace(
          `[WORKER] Compilation job failed ${compilationJob.reason}`
        );

        throw new Error(compilationJob.reason);
      }

      const modifiedFiles = {
        [sourceUri]: documentText,
      };

      for (const unsavedDocument of openDocuments) {
        modifiedFiles[unsavedDocument.uri] = unsavedDocument.documentText;
      }

      compilationJob
        .getResolvedFiles()
        .forEach(
          (resolvedFile: {
            absolutePath: string;
            content: { rawContent: string };
          }) => {
            const normalizeAbsPath = toUnixStyle(resolvedFile.absolutePath);

            if (modifiedFiles[normalizeAbsPath]) {
              resolvedFile.content.rawContent = modifiedFiles[normalizeAbsPath];
            }
          }
        );

      const input = await this.hre.run(
        TASK_COMPILE_SOLIDITY_GET_COMPILER_INPUT,
        {
          compilationJob,
        }
      );

      const compilationDetails = {
        input,
        solcVersion: (compilationJob as CompilationJob).getSolcConfig().version,
      };

      this.lastCompilationDetails = compilationDetails;
      this.lastAnalysis = analysis;
      this.lastAnalyzedDocUri = sourceUri;

      return compilationDetails;
    } catch (error: any) {
      this._clearBuildCache();

      // Translate hardhat error into BuildInputError. Pass other errors through
      if (HardhatError.isHardhatError(error)) {
        const IMPORT_FILE_ERROR_CODES = [404, 405, 406, 407, 408, 409, 412];
        const IMPORT_LIBRARY_ERROR_CODES = [411];

        const { title, message, description, number } = error.errorDescriptor;

        const buildError: BuildInputError = {
          _isBuildInputError: true,
          fileSpecificErrors: {},
          projectWideErrors: [],
        };

        let importString: string | null;

        if (IMPORT_FILE_ERROR_CODES.includes(error.errorDescriptor.number)) {
          importString = error.messageArguments.imported;
        } else if (
          IMPORT_LIBRARY_ERROR_CODES.includes(error.errorDescriptor.number)
        ) {
          importString = error.messageArguments.library;
        } else {
          importString = null;
        }

        if (importString === null) {
          buildError.projectWideErrors = [
            {
              type: "general",
              message: `${title}: ${message}. ${description}`,
              source: "hardhat",
              code: number,
            },
          ];
        } else {
          // Get uri of file with import error
          const errorFileUri = path.join(
            this.hre.config.paths.root,
            error.messageArguments.from
          );

          // If file is in open docs, get the position of the error
          let startOffset;
          let endOffset;
          const errorDoc = openDocuments.find(
            (doc) => doc.uri === errorFileUri
          );
          if (errorDoc !== undefined) {
            const errorDocText = errorDoc.documentText;
            startOffset = errorDocText.indexOf(importString);
            endOffset = startOffset + importString.length;
          }

          buildError.fileSpecificErrors[errorFileUri] = [
            {
              startOffset,
              endOffset,
              error: {
                type: "import",
                source: "hardhat",
                message: title,
                code: number,
              },
            },
          ];
        }

        throw buildError;
      } else {
        throw error;
      }
    }
  }

  public async send(msg: Message) {
    return new Promise<void>((resolve, reject) => {
      if (!process.send) {
        return;
      }

      process.send(msg, (err: unknown) => {
        if (err) {
          return reject(err);
        }

        resolve();
      });
    });
  }
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
new WorkerProcess().start();
