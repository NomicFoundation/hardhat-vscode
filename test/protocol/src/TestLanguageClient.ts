/* eslint-disable @typescript-eslint/no-explicit-any */
import * as cp from 'child_process'
import path from 'path'
import * as rpc from 'vscode-jsonrpc/node'
import {
  InitializedNotification,
  InitializeParams,
  InitializeRequest,
  LogMessageNotification,
} from 'vscode-languageserver-protocol/node'
import baseInitializeParams from './initializeParams.json'
import { Logger } from './utils/Logger'

export class TestLanguageClient {
  protected childProcess!: cp.ChildProcess

  public connection!: rpc.MessageConnection

  constructor(protected serverModulePath: string, protected workspaceFolderPaths: string[], protected logger: Logger) {}

  public async start() {
    this._spawnServerProcess()
    this._setupConnection()
    this._setupRequestHandlers()
    await this._initialize()
    this._initialized()
  }

  protected _spawnServerProcess() {
    this.logger.trace(`About to spawn child process with path ${this.serverModulePath}`)
    this.childProcess = cp.fork(this.serverModulePath, ['--node-ipc'])
    this.logger.trace(`Spawned process with PID ${this.childProcess.pid}`)
  }

  private _setupConnection() {
    // Use stdin and stdout for communication:
    this.logger.trace('Creating IPC connection')
    this.connection = rpc.createMessageConnection(
      new rpc.IPCMessageReader(this.childProcess),
      new rpc.IPCMessageWriter(this.childProcess)
    )

    this.logger.trace('Setting up connection callbacks')
    this.connection.onClose((e) => this.logger.info('Connection closed:', e))
    this.connection.onError((e) => this.logger.error('Worker error:', e))
    this.connection.onDispose((e) => this.logger.info('Connection disposed:', e))
    this.connection.onRequest((request, data) => this.logger.trace('Received request:', request, data))
    this.connection.onUnhandledNotification((notification) =>
      this.logger.trace('Unhandled notification:', notification)
    )

    this.connection.listen()
    this.logger.info('Connection ready')
  }

  private _setupRequestHandlers() {
    // window/logMessage
    this.connection.onNotification(LogMessageNotification.type, (params) =>
      this.logger.info(`server > ${params.message}`)
    )

    // custom/file-indexed
    this.connection.onNotification('custom/file-indexed', () => {
      /* */
    })
  }

  protected async _initialize() {
    const rootUri = path.join(__dirname, '..', '..', 'integration', 'projects')
    const initializeParams: InitializeParams = {
      ...(baseInitializeParams as any),
      rootUri,
      processId: process.pid,
      workspaceFolders: [{ name: 'projects', uri: rootUri }],
    }

    this.logger.trace('Sending Initialize request:', initializeParams)
    const result = await this.connection.sendRequest(InitializeRequest.type, initializeParams)
    this.logger.trace('Initialize result:', JSON.stringify(result, null, 2))
  }

  private _initialized() {
    this.connection.sendNotification(InitializedNotification.type, {})
    this.logger.trace('Sent Initialized')
  }
}
