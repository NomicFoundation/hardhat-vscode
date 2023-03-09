/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { ChildProcess, fork } from "child_process";
import _ from "lodash";
import path from "path";
import {
  CodeAction,
  CompletionItem,
  Diagnostic,
  DidChangeWatchedFilesParams,
  Position,
} from "vscode-languageserver-protocol";
import { TextDocument } from "vscode-languageserver-textdocument";
import { OpenDocuments, ServerState } from "../../types";
import { directoryContains } from "../../utils/directoryContains";
import { Logger } from "../../utils/Logger";
import { CompilationDetails } from "../base/CompilationDetails";
import { InitializationFailedError } from "../base/Errors";
import { FileBelongsResult, Project } from "../base/Project";
import { getImportCompletions } from "./getImportCompletions";
import { resolveActionsFor } from "./resolveActionsFor";
import { LogLevel } from "./worker/WorkerLogger";
import {
  BuildCompilationRequest,
  BuildCompilationResponse,
  ErrorResponseMessage,
  FileBelongsRequest,
  FileBelongsResponse,
  InitializationFailureMessage,
  InvalidateBuildCacheMessage,
  LogMessage,
  Message,
  MessageType,
  ResolveImportRequest,
  ResolveImportResponse,
} from "./worker/WorkerProtocol";

export enum WorkerStatus {
  STOPPED,
  INITIALIZING,
  RUNNING,
  ERRORED,
}

const REQUEST_TIMEOUT = 5000;

export class HardhatProject extends Project {
  public priority = 2;

  public workerProcess?: ChildProcess;

  public workerStatus = WorkerStatus.STOPPED;

  public workerLoadFailureReason = "";

  private _onInitialized!: () => void;

  private requestId = 0;

  private _onResponse: { [requestId: number]: (result: any) => void } = {};
  private _onError: { [requestId: number]: (result: any) => void } = {};

  private logger: Logger;

  private name: string;

  constructor(
    serverState: ServerState,
    basePath: string,
    public configPath: string
  ) {
    super(serverState, basePath);
    this.logger = _.clone(serverState.logger);
    this.name = path.basename(basePath);
    this.logger.tag = `${this.name}`;
  }

  public id(): string {
    return this.configPath;
  }

  public frameworkName(): string {
    return "Hardhat";
  }

  public async initialize(): Promise<void> {
    return new Promise((resolve, _reject) => {
      this._onInitialized = resolve;

      // Fork WorkerProcess as child process
      this.workerProcess = fork(
        path.resolve(__dirname, "worker/WorkerProcess.js"),
        {
          cwd: this.basePath,
          detached: true,
          execArgv: [],
        }
      );
      this.workerStatus = WorkerStatus.INITIALIZING;

      this.workerProcess.on("message", async (message: Message) => {
        try {
          await this._handleMessage(message);
        } catch (error) {
          this.serverState.telemetry.captureException(error);
          this.logger.error(
            `Error while handling worker message: ${error}. Full Message: ${JSON.stringify(
              message
            )}`
          );
        }
      });

      this.workerProcess.on("error", (err) => {
        this.logger.error(err);
      });

      this.workerProcess.on("exit", async (code) => {
        this.logger.info(`Child process exited: ${code}`);

        // Worker may exit gracefully on restart (i.e. hardhat.config file changed)
        if ([0, null].includes(code)) {
          this.workerStatus = WorkerStatus.STOPPED;
        } else {
          this.workerStatus = WorkerStatus.ERRORED;
        }

        this._onInitialized();
      });
    });
  }

  public async fileBelongs(sourceURI: string): Promise<FileBelongsResult> {
    const workerPromise = new Promise((resolve, reject) => {
      this._assertWorkerExists();
      this._assertWorkerNotInitializing();

      if (this.workerStatus === WorkerStatus.RUNNING) {
        // HRE was loaded successfully. Delegate to the worker that will use the configured sources path
        const requestId = this._prepareRequest(resolve, reject);

        this.workerProcess!.send(new FileBelongsRequest(requestId, sourceURI));
      } else {
        // HRE could not be loaded. Claim ownership of all solidity files under root folder
        // This is to avoid potential hardhat-owned contracts being assigned to i.e. projectless
        resolve({
          belongs: directoryContains(this.basePath, sourceURI),
          isLocal: true,
        });
      }
    });

    return Promise.race([
      workerPromise,
      this._requestTimeout("fileBelongs"),
    ]) as Promise<FileBelongsResult>;
  }

  public async buildCompilation(
    sourceUri: string,
    openDocuments: OpenDocuments
  ): Promise<CompilationDetails> {
    const workerPromise = new Promise((resolve, reject) => {
      this._assertWorkerExists();
      this._assertWorkerNotInitializing();
      this._checkWorkerNotErrored();

      const requestId = this._prepareRequest(resolve, reject);

      this.workerProcess!.send(
        new BuildCompilationRequest(requestId, sourceUri, openDocuments)
      );
    });

    return Promise.race([
      workerPromise,
      this._requestTimeout("buildCompilation"),
    ]) as Promise<CompilationDetails>;
  }

  private _prepareRequest(
    resolve: (value: unknown) => void,
    reject: (reason?: any) => void
  ): number {
    this.requestId++;

    this._onResponse[this.requestId] = resolve;
    this._onError[this.requestId] = reject;

    return this.requestId;
  }

  public async onWatchedFilesChanges({
    changes,
  }: DidChangeWatchedFilesParams): Promise<void> {
    for (const change of changes) {
      if (change.uri.endsWith(".sol")) {
        if (this._isWorkerRunning()) {
          this.workerProcess!.send(new InvalidateBuildCacheMessage());
        }
      } else if (change.uri === this.configPath) {
        this.logger.info(`Config file changed. Restarting worker process.`);

        // Kill existing worker process
        this.workerProcess?.kill("SIGKILL");

        // Spawn new worker process
        await this.initialize();
      }
    }
  }

  public async resolveImportPath(from: string, importPath: string) {
    const workerPromise = new Promise((resolve, reject) => {
      this._assertWorkerExists();
      this._assertWorkerIsRunning();

      // HRE was loaded successfully. Delegate to the worker that will use the configured sources path
      const requestId = this._prepareRequest(resolve, reject);

      this.workerProcess!.send(
        new ResolveImportRequest(requestId, from, importPath, this.basePath)
      );
    });

    return Promise.race([
      workerPromise,
      this._requestTimeout("fileBelongs"),
    ]) as Promise<string>;
  }

  public invalidateBuildCache() {
    this.workerProcess?.send(new InvalidateBuildCacheMessage());
  }

  public getImportCompletions(
    position: Position,
    currentImport: string
  ): CompletionItem[] {
    return getImportCompletions(
      { basePath: this.basePath, solFileIndex: this.serverState.solFileIndex },
      position,
      currentImport
    );
  }

  public resolveActionsFor(
    diagnostic: Diagnostic,
    document: TextDocument,
    uri: string
  ): CodeAction[] {
    return resolveActionsFor(this.serverState, diagnostic, document, uri);
  }

  private _requestTimeout(label: string) {
    return new Promise((_resolve, reject) => {
      setTimeout(() => {
        reject(`Request (${label}) timed out`);
      }, REQUEST_TIMEOUT);
    });
  }

  private async _handleMessage(message: Message) {
    switch (message.type) {
      case MessageType.INITIALIZED:
        return this._handleInitialized();

      case MessageType.LOG:
        this._handleLog(message as LogMessage);
        break;

      case MessageType.ERROR_RESPONSE:
        this._handleErrorResponse(message as ErrorResponseMessage);
        break;

      case MessageType.FILE_BELONGS_RESPONSE:
        this._handleFileBelongsResponse(message as FileBelongsResponse);
        break;

      case MessageType.RESOLVE_IMPORT_RESPONSE:
        this._handleResolveImportResponse(message as ResolveImportResponse);
        break;

      case MessageType.BUILD_COMPILATION_RESPONSE:
        this._handleBuildCompilationResponse(
          message as BuildCompilationResponse
        );
        break;

      case MessageType.INITIALIZATION_FAILURE:
        this._handleInitializationFailure(
          message as InitializationFailureMessage
        );
        break;

      default:
        this.logger.error(
          `Unknown message received from worker: ${JSON.stringify(message)}`
        );
        break;
    }
  }

  private _handleLog(message: LogMessage) {
    switch (message.level) {
      case LogLevel.TRACE:
        this.logger.trace(message.logMessage);
        break;
      case LogLevel.INFO:
        this.logger.info(message.logMessage);
        break;
      case LogLevel.ERROR:
        this.logger.error(message.logMessage);
        break;
    }
  }

  private async _handleInitialized() {
    this.workerStatus = WorkerStatus.RUNNING;
    this.logger.info("Local HRE loaded");

    await this.serverState.connection.sendNotification(
      "custom/worker-initialized",
      {
        projectBasePath: this.basePath,
      }
    );

    this._onInitialized();
  }

  private _handleInitializationFailure(msg: InitializationFailureMessage) {
    this.workerLoadFailureReason = msg.reason;
  }

  private _handleErrorResponse(msg: ErrorResponseMessage) {
    const errorFunction = this._onError[msg.requestId];

    if (errorFunction === undefined) {
      this.logger.error(
        `Error function not found for request id ${msg.requestId}`
      );
    } else {
      delete this._onError[msg.requestId];
      delete this._onResponse[msg.requestId];
      errorFunction(msg.error);
    }
  }

  private _handleFileBelongsResponse(msg: FileBelongsResponse) {
    this._handleResponse(msg.requestId, msg.result);
  }

  private _handleResolveImportResponse(msg: ResolveImportResponse) {
    this._onResponse[msg.requestId](msg.path);
  }

  private _handleBuildCompilationResponse(msg: BuildCompilationResponse) {
    this._handleResponse(msg.requestId, msg.compilationDetails);
  }

  private _handleResponse(requestId: number, result: any) {
    const resolveFunction = this._onResponse[requestId];
    if (resolveFunction === undefined) {
      this.logger.error(
        `Resolve function not found for request id ${requestId}`
      );
    } else {
      delete this._onResponse[requestId];
      delete this._onError[requestId];
      resolveFunction(result);
    }
  }

  private _assertWorkerExists() {
    if (this.workerProcess === undefined) {
      throw new Error("Worker process not spawned");
    }
  }

  private _assertWorkerNotInitializing() {
    if (this.workerStatus === WorkerStatus.INITIALIZING) {
      throw new Error("Worker is initializing");
    }
  }

  private _assertWorkerIsRunning() {
    if (!this._isWorkerRunning()) {
      throw new Error(
        `Worker is not running. Status: ${this.workerStatus}, error: ${this.workerLoadFailureReason}`
      );
    }
  }

  private _isWorkerRunning() {
    return this.workerStatus === WorkerStatus.RUNNING;
  }

  private _checkWorkerNotErrored() {
    if (this.workerStatus === WorkerStatus.ERRORED) {
      const error: InitializationFailedError = {
        _isInitializationFailedError: true,
        error: this.workerLoadFailureReason,
      };

      throw error;
    }
  }
}
