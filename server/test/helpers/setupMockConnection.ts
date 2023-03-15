import * as sinon from "sinon";

export function setupMockConnection() {
  return {
    console: {
      log: sinon.spy(),
      error: sinon.spy(),
    },
    onInitialize: sinon.spy(),
    onInitialized: sinon.spy(),
    onSignatureHelp: sinon.spy(),
    onCompletion: sinon.spy(),
    onDefinition: sinon.spy(),
    onTypeDefinition: sinon.spy(),
    onReferences: sinon.spy(),
    onImplementation: sinon.spy(),
    onRenameRequest: sinon.spy(),
    onDidOpenTextDocument: sinon.spy(),
    onDidChangeTextDocument: sinon.spy(),
    onDidCloseTextDocument: sinon.spy(),
    onWillSaveTextDocument: sinon.spy(),
    onWillSaveTextDocumentWaitUntil: sinon.spy(),
    onDidSaveTextDocument: sinon.spy(),
    onDidChangeWatchedFiles: sinon.spy(),
    onHover: sinon.spy(),
    sendNotification: sinon.spy(),
    onCodeAction: sinon.spy(),
    onDocumentFormatting: sinon.spy(),
    onNotification: sinon.fake(
      (
        _method: string,
        handler: (
          unsavedDocuments: Array<{
            uri: string;
            languageId: string;
            version: number;
            content: string;
          }>
        ) => void
      ) => {
        handler([]);
      }
    ),
    sendDiagnostics: sinon.spy(),
    onRequest: sinon.spy(),
    onExit: sinon.spy(),
  };
}
