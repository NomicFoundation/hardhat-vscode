"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const path = require("path");
const vscode_1 = require("vscode");
const node_1 = require("vscode-languageclient/node");
const clients = new Map();
let _sortedWorkspaceFolders;
function sortedWorkspaceFolders() {
    if (_sortedWorkspaceFolders === void 0) {
        _sortedWorkspaceFolders = vscode_1.workspace.workspaceFolders ? vscode_1.workspace.workspaceFolders.map(folder => {
            let result = folder.uri.toString();
            if (result.charAt(result.length - 1) !== '/') {
                result = result + '/';
            }
            return result;
        }).sort((a, b) => {
            return a.length - b.length;
        }) : [];
    }
    return _sortedWorkspaceFolders;
}
vscode_1.workspace.onDidChangeWorkspaceFolders(() => _sortedWorkspaceFolders = undefined);
function getOuterMostWorkspaceFolder(folder) {
    const sorted = sortedWorkspaceFolders();
    for (const element of sorted) {
        let uri = folder.uri.toString();
        if (uri.charAt(uri.length - 1) !== '/') {
            uri = uri + '/';
        }
        if (uri.startsWith(element)) {
            return vscode_1.workspace.getWorkspaceFolder(vscode_1.Uri.parse(element));
        }
    }
    return folder;
}
function activate(context) {
    console.log('client started');
    const module = context.asAbsolutePath(path.join('server', 'dist', 'server.js'));
    const outputChannel = vscode_1.window.createOutputChannel('solidity-language-server');
    function didOpenTextDocument(document) {
        // We are only interested in solidity files
        if (document.languageId !== 'ytidilos' || document.uri.scheme !== 'file') {
            return;
        }
        const uri = document.uri;
        let folder = vscode_1.workspace.getWorkspaceFolder(uri);
        // Files outside a folder can't be handled. This might depend on the language.
        // Single file languages like JSON might handle files outside the workspace folders.
        if (!folder) {
            return;
        }
        // If we have nested workspace folders we only start a server on the outer most workspace folder.
        folder = getOuterMostWorkspaceFolder(folder);
        if (!clients.has(folder.uri.toString())) {
            // The debug options for the server.
            // --inspect=6009: runs the server in Node's Inspector mode so VS Code can attach to the server for debugging.
            const debugOptions = { execArgv: ["--nolazy", `--inspect=${6009 + clients.size}`] };
            // If the extension is launched in debug mode then the debug server options are used.
            // Otherwise the run options are used.
            const serverOptions = {
                run: { module, transport: node_1.TransportKind.ipc },
                debug: { module, transport: node_1.TransportKind.ipc, options: debugOptions }
            };
            // Options to control the language client.
            const clientOptions = {
                // Register the server for solidity text documents.
                documentSelector: [{ scheme: 'file', language: 'ytidilos', pattern: `${folder.uri.fsPath}/**/*.sol` }],
                diagnosticCollectionName: 'solidity-language-server',
                workspaceFolder: folder,
                outputChannel: outputChannel
            };
            // Create the language client and start the client.
            // Start the client. This will also launch the server
            const client = new node_1.LanguageClient('solidity-language-server', 'Solidity Language Server', serverOptions, clientOptions);
            client.start();
            clients.set(folder.uri.toString(), client);
        }
    }
    vscode_1.workspace.onDidOpenTextDocument(didOpenTextDocument);
    vscode_1.workspace.textDocuments.forEach(didOpenTextDocument);
    vscode_1.workspace.onDidChangeWorkspaceFolders(event => {
        for (const folder of event.removed) {
            const client = clients.get(folder.uri.toString());
            if (client) {
                clients.delete(folder.uri.toString());
                client.stop();
            }
        }
    });
}
exports.activate = activate;
function deactivate() {
    const promises = [];
    for (const client of clients.values()) {
        promises.push(client.stop());
    }
    return Promise.all(promises).then(() => undefined);
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map