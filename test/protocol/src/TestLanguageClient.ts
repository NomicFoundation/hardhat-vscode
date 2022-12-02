/* eslint-disable @typescript-eslint/no-explicit-any */
import * as cp from 'child_process'
import { readFileSync } from 'fs'
import _ from 'lodash'
import path from 'path'
import * as rpc from 'vscode-jsonrpc/node'
import {
  DefinitionParams,
  DefinitionRequest,
  Diagnostic,
  DidChangeTextDocumentNotification,
  DidOpenTextDocumentNotification,
  ImplementationParams,
  ImplementationRequest,
  InitializedNotification,
  InitializeParams,
  InitializeRequest,
  LogMessageNotification,
  Position,
  PublishDiagnosticsNotification,
  ReferenceParams,
  ReferencesRequest,
  RenameParams,
  RenameRequest,
  TypeDefinitionParams,
  TypeDefinitionRequest,
} from 'vscode-languageserver-protocol/node'
import { toUri } from './helpers'
import baseInitializeParams from './initializeParams.json'
import { Logger } from './utils/Logger'

export class TestLanguageClient {
  protected serverProcess?: cp.ChildProcess
  public connection?: rpc.MessageConnection
  public diagnostics: Record<string, Diagnostic[]> = {}

  constructor(protected serverModulePath: string, protected workspaceFolderPaths: string[], protected logger: Logger) {}

  public async start() {
    this._spawnServerProcess()
    this._setupConnection()
    this._setupRequestHandlers()
    // await this._initialize()
    // this._initialized()
  }

  public stop() {
    this.serverProcess?.kill('SIGKILL')
    this.serverProcess = undefined

    this.connection?.dispose()
    this.connection?.end()

    this.connection = undefined
  }

  public async initialize() {
    if (this.connection === undefined) {
      throw new Error(`No connection`)
    }

    const result = await this._initialize()
    this._initialized()
    return result
  }

  public openDocument(documentPath: string) {
    if (this.connection === undefined) {
      throw new Error(`No connection`)
    }

    const uri = toUri(documentPath)

    const documentParams = {
      textDocument: {
        uri,
        languageId: 'solidity',
        version: 1,
        text: readFileSync(documentPath).toString(),
      },
    }
    this.connection.sendNotification(DidOpenTextDocumentNotification.type, documentParams)
  }

  public async assertDiagnostic(documentPath: string, filter: Partial<Diagnostic>) {
    const uri = toUri(documentPath)
    // Function to check if a diagnostic matches the given filter
    const diagnosticMatcher = (diag: Diagnostic) => {
      if (filter.code !== undefined && filter.code !== diag.code) {
        return false
      }
      if (filter.message !== undefined && !diag.message.includes(filter.message)) {
        return false
      }
      if (filter.range && !_.isEqual(diag.range, filter.range)) {
        return false
      }
      if (filter.severity !== undefined && filter.severity !== diag.severity) {
        return false
      }
      if (filter.source !== undefined && filter.source !== diag.source) {
        return false
      }
      return true
    }

    // Wait for the expected diagnostic to arrive
    const timeout = 2000
    await new Promise<void>((resolve) => {
      const start = new Date().getTime()
      const intervalId = setInterval(() => {
        const existingDiagnostics = this.diagnostics[uri] ?? []

        if (new Date().getTime() - start > timeout) {
          clearInterval(intervalId)
          throw new Error(
            `Expected diagnostic for ${uri} not found, but have: ${JSON.stringify(existingDiagnostics, null, 2)}`
          )
        } else {
          for (const existingDiagnostic of existingDiagnostics) {
            if (diagnosticMatcher(existingDiagnostic)) {
              clearInterval(intervalId)
              resolve()
            }
          }
        }
      }, 10)
    })
  }

  public async findReferences(uri: string, position: Position) {
    const params: ReferenceParams = {
      textDocument: {
        uri,
      },
      position,
      context: {
        includeDeclaration: true,
      },
    }
    const result = await this.connection!.sendRequest(ReferencesRequest.type, params)

    return result ?? []
  }

  public async findImplementations(uri: string, position: Position) {
    const params: ImplementationParams = {
      textDocument: {
        uri,
      },
      position,
    }

    const result = await this.connection!.sendRequest(ImplementationRequest.type, params)

    return result ?? []
  }

  public async findDefinition(uri: string, position: Position) {
    const params: DefinitionParams = {
      textDocument: {
        uri,
      },
      position,
    }

    return this.connection!.sendRequest(DefinitionRequest.type, params)
  }

  public async findTypeDefinition(uri: string, position: Position) {
    const params: TypeDefinitionParams = {
      textDocument: {
        uri,
      },
      position,
    }

    return this.connection!.sendRequest(TypeDefinitionRequest.type, params)
  }

  public async rename(uri: string, position: Position, newName: string) {
    const params: RenameParams = {
      textDocument: {
        uri,
      },
      position,
      newName,
    }

    return this.connection!.sendRequest(RenameRequest.type, params)
  }

  public clearDiagnostics() {
    this.diagnostics = {}
  }

  protected _spawnServerProcess() {
    this.logger.trace(`About to spawn child process with path ${this.serverModulePath}`)
    this.serverProcess = cp.fork(this.serverModulePath, ['--node-ipc'])
    this.logger.trace(`Spawned process with PID ${this.serverProcess.pid}`)
  }

  private _setupConnection() {
    // Use stdin and stdout for communication:
    this.logger.trace('Creating IPC connection')
    this.connection = rpc.createMessageConnection(
      new rpc.IPCMessageReader(this.serverProcess!),
      new rpc.IPCMessageWriter(this.serverProcess!)
    )

    this.logger.trace('Setting up connection callbacks')
    this.connection.onClose((e) => this.logger.trace('Connection closed:', e))
    this.connection.onError((e) => this.logger.error('Worker error:', e))
    this.connection.onDispose((e) => this.logger.trace('Connection disposed:', e))
    this.connection.onRequest((request, data) => this.logger.trace('Received request:', request, data))
    this.connection.onNotification((notif, data) => this.logger.trace('Received notification:', notif, data))
    this.connection.onUnhandledNotification((notification) =>
      this.logger.trace('Unhandled notification:', notification)
    )

    this.connection.listen()
    this.logger.trace('Connection ready')
  }

  private _setupRequestHandlers() {
    // window/logMessage
    this.connection!.onNotification(LogMessageNotification.type, (params) =>
      this.logger.trace(`server > ${params.message}`)
    )

    // custom/file-indexed
    this.connection!.onNotification('custom/file-indexed', () => {
      /* */
    })

    // textDocument/publishDiagnostics
    this.connection!.onNotification(PublishDiagnosticsNotification.type, (params) => {
      this.logger.trace(`Diagnostic received for ${params.uri}`)
      this.diagnostics[params.uri] = params.diagnostics
    })
  }

  protected async _initialize() {
    const initializeParams: InitializeParams = {
      ...(baseInitializeParams as any),
      processId: process.pid,
      workspaceFolders: this.workspaceFolderPaths.map((p) => ({ name: path.basename(p), uri: p })),
    }

    this.logger.trace('Sending Initialize request:', initializeParams)
    const result = await this.connection!.sendRequest(InitializeRequest.type, initializeParams)
    this.logger.trace('Initialize result:', JSON.stringify(result, null, 2))

    return result
  }

  private _initialized() {
    this.connection!.sendNotification(InitializedNotification.type, {})
    this.logger.trace('Sent Initialized')
  }
}
