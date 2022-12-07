/* eslint-disable @typescript-eslint/no-explicit-any */
import * as cp from 'child_process'
import { readFileSync } from 'fs'
import _ from 'lodash'
import path from 'path'
import * as rpc from 'vscode-jsonrpc/node'
import {
  CodeActionParams,
  CodeActionRequest,
  CompletionParams,
  CompletionRequest,
  CompletionTriggerKind,
  DefinitionParams,
  DefinitionRequest,
  Diagnostic,
  DidChangeTextDocumentNotification,
  DidCloseTextDocumentNotification,
  DidCloseTextDocumentParams,
  DidOpenTextDocumentNotification,
  DidOpenTextDocumentParams,
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
import { makeRange } from '../test/helpers'
import { toUri } from './helpers'
import baseInitializeParams from './initializeParams.json'
import { Logger } from './utils/Logger'

class Document {
  public waitAnalyzed: Promise<void>
  public onAnalyzed!: (value: void) => void

  constructor(public uri: string, public text: string) {
    this.waitAnalyzed = new Promise<void>((resolve) => {
      this.onAnalyzed = resolve
    })
  }
}

export class TestLanguageClient {
  protected serverProcess?: cp.ChildProcess
  public connection?: rpc.MessageConnection
  public diagnostics: Record<string, Diagnostic[]> = {}
  // public onAnalyzed: Record<string, Promise<void>> = {} // promises that resolve once an opened file is analyzed
  public documents: Record<string, Document> = {}

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

  public async openDocument(documentPath: string) {
    this._checkConnection()

    const uri = toUri(documentPath)
    const text = readFileSync(documentPath).toString()

    const documentParams: DidOpenTextDocumentParams = {
      textDocument: {
        uri,
        languageId: 'solidity',
        version: 1,
        text,
      },
    }
    this.connection!.sendNotification(DidOpenTextDocumentNotification.type, documentParams)

    const document = new Document(uri, text)
    this.documents[uri] = document

    await document.waitAnalyzed
  }

  public closeDocument(documentPath: string) {
    this._checkConnection()
    const uri = toUri(documentPath)

    const params: DidCloseTextDocumentParams = {
      textDocument: {
        uri,
      },
    }

    this.connection!.sendNotification(DidCloseTextDocumentNotification.type, params)

    delete this.documents[uri]
  }

  // public async waitAnalyzed(uri: string) {
  //   await this.documents[uri].waitAnalyzed
  // }

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
    return new Promise<Diagnostic>((resolve) => {
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
              resolve(existingDiagnostic)
            }
          }
        }
      }, 10)
    })
  }

  public async getCodeActions(uri: string, diagnostic: Diagnostic) {
    const params: CodeActionParams = {
      textDocument: {
        uri,
      },
      context: {
        diagnostics: [diagnostic],
      },
      range: diagnostic.range,
    }

    const result = await this.connection!.sendRequest(CodeActionRequest.type, params)

    return result ?? []
  }

  public async getCompletions(
    uri: string,
    line: number,
    character: number,
    triggerKind: CompletionTriggerKind = CompletionTriggerKind.Invoked,
    triggerCharacter: string | undefined = undefined
  ) {
    const params: CompletionParams = {
      textDocument: {
        uri,
      },
      position: {
        line,
        character,
      },
      context: {
        triggerKind,
        triggerCharacter,
      },
    }

    const completions = await this.connection!.sendRequest(CompletionRequest.type, params)

    return completions ?? []
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

    // custom/analyzed
    this.connection!.onNotification('custom/analyzed', ({ uri }: { uri: string }) => {
      this.documents[uri].onAnalyzed()
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

  private _checkConnection() {
    if (this.connection === undefined) {
      throw new Error(`No connection`)
    }
  }
}
