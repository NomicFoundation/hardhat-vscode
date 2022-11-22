/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-unused-vars */
import * as cp from 'child_process'
import path from 'path'
import * as rpc from 'vscode-jsonrpc/node'
import * as protocol from 'vscode-languageserver-protocol/node'
import {
  InitializedNotification,
  InitializedParams,
  InitializeParams,
  InitializeRequest,
  LogMessageNotification,
} from 'vscode-languageserver-protocol/node'

enum LogLevel {
  TRACE,
  INFO,
  WARN,
  ERROR,
}

class Logger {
  constructor(public level: LogLevel) {}

  public log(level: LogLevel, ...msgs: unknown[]) {
    if (level >= this.level) {
      console.log(...msgs)
    }
  }

  public trace(...msgs: unknown[]) {
    this.log(LogLevel.TRACE, ...msgs)
  }

  public info(...msgs: unknown[]) {
    this.log(LogLevel.INFO, ...msgs)
  }

  public warn(...msgs: unknown[]) {
    this.log(LogLevel.WARN, ...msgs)
  }

  public error(...msgs: unknown[]) {
    this.log(LogLevel.ERROR, ...msgs)
  }
}

class TestLanguageClient {
  protected childProcess!: cp.ChildProcess
  protected logger: Logger
  protected connection!: rpc.MessageConnection

  constructor(
    protected serverModulePath: string,
    protected workspaceFolderPaths: string[],
    logLevel: LogLevel = LogLevel.INFO
  ) {
    this.logger = new Logger(logLevel)
  }

  public async start() {
    this._spawnServerProcess()
    this._setupConnection()
    await this._initialize()
    this._initialized()
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
    this.connection.onRequest((request) => this.logger.info('Received request:', request))

    // log message notifications
    this.connection.onNotification(LogMessageNotification.type, (params) => console.log(`server > ${params.message}`))

    this.connection.listen()
    this.logger.info('Connection ready')
  }

  protected _spawnServerProcess() {
    this.logger.trace(`About to spawn child process with path ${this.serverModulePath}`)
    this.childProcess = cp.fork(this.serverModulePath, ['--node-ipc'])
    this.logger.trace(`Spawned process with PID ${this.childProcess.pid}`)
  }

  protected async _initialize() {
    const rootUri = path.join(__dirname, '..', '..', 'integration', 'projects')
    const initializeParams: InitializeParams = {
      rootUri,
      capabilities: {},
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

const main = async () => {
  const serverModulePath = path.join(__dirname, '..', '..', '..', 'server', 'out', 'index.js')
  const workspaceFolderPaths = [path.join(__dirname, '..', '..', 'integration', 'projects')]
  const client = new TestLanguageClient(serverModulePath, workspaceFolderPaths, LogLevel.TRACE)
  await client.start()
  // const childProcess = cp.fork(path.join(__dirname, '..', '..', '..', 'server', 'out', 'index.js'), ['--node-ipc'])
  // console.log(`Server process spawned. pid: ${childProcess.pid}`)

  // // Use stdin and stdout for communication:
  // const connection = rpc.createMessageConnection(
  //   new rpc.IPCMessageReader(childProcess),
  //   new rpc.IPCMessageWriter(childProcess)
  // )

  // const notification = new rpc.NotificationType<string>('testNotification')

  // connection.onClose((e) => console.log('close', e))
  // connection.onError((e) => console.log('error', e))
  // connection.onDispose((e) => console.log('dispose', e))
  // // connection.onUnhandledNotification((e) =>
  // //   console.log("unhandled notification", e)
  // // );
  // // connection.onNotification((a, b) => console.log("notification", a, b));
  // connection.onRequest((n) => console.log('request', n))

  // connection.onNotification(LogMessageNotification.type, (params) => console.log(`server > ${params.message}`))

  // connection.listen()
  // console.log('Listening on connection')

  // const rootUri = path.join(__dirname, '..', '..', 'integration', 'projects')
  // const initializeParams: InitializeParams = {
  //   rootUri,
  //   capabilities: {},
  //   processId: process.pid,
  //   workspaceFolders: [{ name: 'projects', uri: rootUri }],
  // }

  // console.log('Sending initialize')
  // await connection.sendRequest(InitializeRequest.type, initializeParams)
  // console.log('Initialize done')

  // connection.sendNotification(InitializedNotification.type, {})
  // console.log('Sent Initialized')
}

main()
