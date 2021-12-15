import * as sinon from 'sinon';

export function setupMockConnection() {
    return {
        console: {
            log: sinon.spy()
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
        sendNotification: sinon.spy()
    };
}