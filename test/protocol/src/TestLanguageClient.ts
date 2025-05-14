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
  DidChangeTextDocumentParams,
  DidChangeWatchedFilesParams,
  DidCloseTextDocumentNotification,
  DidCloseTextDocumentParams,
  DidOpenTextDocumentNotification,
  DidOpenTextDocumentParams,
  DocumentFormattingParams,
  DocumentFormattingRequest,
  DocumentSymbolParams,
  DocumentSymbolRequest,
  ImplementationParams,
  ImplementationRequest,
  InitializedNotification,
  InitializeParams,
  InitializeRequest,
  LogMessageNotification,
  Position,
  PublishDiagnosticsNotification,
  Range,
  ReferenceParams,
  ReferencesRequest,
  RenameParams,
  RenameRequest,
  SemanticTokensParams,
  SemanticTokensRequest,
  TypeDefinitionParams,
  TypeDefinitionRequest,
} from 'vscode-languageserver-protocol/node'
import { toUri } from './helpers'
import baseInitializeParams from './initializeParams.json'
import { Logger } from './utils/Logger'

class Document {
  public waitAnalyzed!: Promise<void>
  public waitValidated!: Promise<void>
  public onAnalyzed!: (value: void) => void
  public onValidated!: (value: void) => void
  public diagnostics: Diagnostic[] = []
  public version = 1

  constructor(public uri: string, public text: string) {
    this.resetAnalysisStatus()
    this.resetValidationStatus()
  }

  public clearDiagnostics() {
    this.diagnostics = []
  }

  public increaseVersion() {
    this.version += 1
  }

  public resetAnalysisStatus() {
    this.waitAnalyzed = new Promise<void>((resolve) => {
      this.onAnalyzed = resolve
    })
  }

  public resetValidationStatus() {
    this.waitValidated = new Promise<void>((resolve) => {
      this.onValidated = resolve
    })
  }
}

export class TestLanguageClient {
  protected serverProcess?: cp.ChildProcess
  public connection?: rpc.MessageConnection
  public documents: Record<string, Document> = {}
  public receivedNotifications: Record<string, any[]> = {}

  constructor(protected serverModulePath: string, protected workspaceFolderPaths: string[], protected logger: Logger) {}

  public start() {
    this._spawnServerProcess()
    this._setupConnection()
    this._setupRequestHandlers()
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
    await this._initialized()
    return result
  }

  public async openDocument(documentPath: string) {
    this._checkConnection()

    const uri = toUri(documentPath)
    const text = readFileSync(documentPath).toString()

    const document = new Document(uri, text)
    this.documents[uri] = document

    const documentParams: DidOpenTextDocumentParams = {
      textDocument: {
        uri,
        languageId: 'solidity',
        version: document.version,
        text,
      },
    }

    await this.connection!.sendNotification(DidOpenTextDocumentNotification.type, documentParams)

    await document.waitAnalyzed
    await document.waitValidated

    return document
  }

  public async changeDocument(documentPath: string, range: Range, text: string) {
    const uri = toUri(documentPath)
    const document = this.documents[uri]

    if (document === undefined) {
      throw new Error(`Document not indexed: ${uri}`)
    }

    document.increaseVersion()
    document.resetAnalysisStatus()
    document.resetValidationStatus()

    const params: DidChangeTextDocumentParams = {
      textDocument: {
        uri,
        version: document.version,
      },
      contentChanges: [{ range, text }],
    }

    await this.connection!.sendNotification('textDocument/didChange', params)
  }

  public async changeWatchedFiles(params: DidChangeWatchedFilesParams) {
    await this.connection!.sendNotification('workspace/didChangeWatchedFiles', params)
  }

  public async closeAllDocuments() {
    for (const [uri] of Object.entries(this.documents)) {
      await this.closeDocument(uri)
    }
  }

  public async closeDocument(uri: string) {
    this._checkConnection()

    const params: DidCloseTextDocumentParams = {
      textDocument: {
        uri,
      },
    }

    await this.connection!.sendNotification(DidCloseTextDocumentNotification.type, params)

    delete this.documents[uri]
  }

  public async getDiagnostic(documentPath: string, filter: Partial<Diagnostic>) {
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
    const timeout = 20000
    return new Promise<Diagnostic>((resolve) => {
      const start = new Date().getTime()
      const intervalId = setInterval(() => {
        const existingDiagnostics = this.documents[uri].diagnostics ?? []

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

  // get a notification or wait it for some time if it didn't arrive yet
  public async getOrWaitNotification(notificationType: string, dataMatcher: any = {}, timeout = 2000) {
    return new Promise<any>((resolve) => {
      const start = new Date().getTime()
      const intervalId = setInterval(() => {
        const existingNotifications = this.receivedNotifications[notificationType] ?? []
        if (new Date().getTime() - start > timeout) {
          clearInterval(intervalId)
          throw new Error(
            `Notification ${notificationType} with matcher ${JSON.stringify(
              dataMatcher,
              null,
              2
            )} not found, but have: ${JSON.stringify(existingNotifications, null, 2)}`
          )
        } else {
          for (const existingNotification of existingNotifications) {
            if (_.isMatch(existingNotification, dataMatcher)) {
              clearInterval(intervalId)
              resolve(existingNotification)
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

  public async getSemanticTokensFull(uri: string) {
    const params: SemanticTokensParams = {
      textDocument: {
        uri,
      },
    }

    return this.connection!.sendRequest(SemanticTokensRequest.type, params)
  }

  public async getDocumentSymbols(uri: string) {
    const params: DocumentSymbolParams = {
      textDocument: {
        uri,
      },
    }

    return this.connection!.sendRequest(DocumentSymbolRequest.type, params)
  }

  public async formatDocument(uri: string) {
    const params: DocumentFormattingParams = {
      textDocument: {
        uri,
      },
      options: { insertSpaces: true, tabSize: 0 },
    }

    return this.connection!.sendRequest(DocumentFormattingRequest.type, params)
  }

  public changeExtensionConfig(config: any) {
    return this.connection!.sendNotification('custom/didChangeExtensionConfig', config)
  }

  public clear() {
    // Diagnostics
    for (const document of Object.values(this.documents)) {
      document.clearDiagnostics()
    }

    // Custom notifications
    this.receivedNotifications = {}
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

    this.connection.listen()
    this.logger.trace('Connection ready')
  }

  private _setupRequestHandlers() {
    // window/logMessage
    this.connection!.onNotification(LogMessageNotification.type, (params) =>
      this.logger.trace(`server > ${params.message}`)
    )

    // custom/analyzed
    this.connection!.onNotification('custom/analyzed', ({ uri }: { uri: string }) => {
      this.documents[uri].onAnalyzed()
    })

    // custom/validated
    this.connection!.onNotification('custom/validated', ({ uri }: { uri: string }) => {
      this.documents[uri].onValidated()
    })

    // textDocument/publishDiagnostics
    this.connection!.onNotification(PublishDiagnosticsNotification.type, (params) => {
      this.logger.trace(`Diagnostic received for ${params.uri}: ${JSON.stringify(params.diagnostics, null, 2)}`)
      this.documents[params.uri].diagnostics = params.diagnostics
    })

    // Other notifications
    this.connection!.onNotification((notificationType, data) => {
      this.logger.trace('Received notification:', notificationType, data)
      this.receivedNotifications[notificationType] = this.receivedNotifications[notificationType] ?? []
      this.receivedNotifications[notificationType].push(data)
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

  private async _initialized() {
    await this.connection!.sendNotification(InitializedNotification.type, {})
    this.logger.trace('Sent Initialized')
  }

  private _checkConnection() {
    if (this.connection === undefined) {
      throw new Error(`No connection`)
    }
  }
}
