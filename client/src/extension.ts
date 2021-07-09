/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import * as path from 'path';
import {
	workspace, window, ExtensionContext, TextDocument,
	OutputChannel, WorkspaceFolder, Uri
} from 'vscode';
import {
	LanguageClient, LanguageClientOptions, TransportKind
} from 'vscode-languageclient/node';

const clients: Map<string, LanguageClient> = new Map();

let _sortedWorkspaceFolders: string[] | undefined;
function sortedWorkspaceFolders(): string[] {
	if (_sortedWorkspaceFolders === void 0) {
		_sortedWorkspaceFolders = workspace.workspaceFolders ? workspace.workspaceFolders.map(folder => {
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

workspace.onDidChangeWorkspaceFolders(() => _sortedWorkspaceFolders = undefined);

function getOuterMostWorkspaceFolder(folder: WorkspaceFolder): WorkspaceFolder {
	const sorted = sortedWorkspaceFolders();

	for (const element of sorted) {
		let uri = folder.uri.toString();

		if (uri.charAt(uri.length - 1) !== '/') {
			uri = uri + '/';
		}

		if (uri.startsWith(element)) {
			return workspace.getWorkspaceFolder(Uri.parse(element))!;
		}
	}

	return folder;
}

export function activate(context: ExtensionContext) {
	console.log('client started');

	const module = context.asAbsolutePath(path.join('server', 'dist', 'server.js'));
	const outputChannel: OutputChannel = window.createOutputChannel('solidity-language-server');

	function didOpenTextDocument(document: TextDocument): void {
		// We are only interested in solidity files
		if (document.languageId !== 'solidity' || document.uri.scheme !== 'file') {
			return;
		}

		const uri = document.uri;
		let folder = workspace.getWorkspaceFolder(uri);

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
				run: { module, transport: TransportKind.ipc },
				debug: { module, transport: TransportKind.ipc, options: debugOptions }
			};

			// Options to control the language client.
			const clientOptions: LanguageClientOptions = {
				// Register the server for solidity text documents.
				documentSelector: [{ scheme: 'file', language: 'solidity', pattern: `${folder.uri.fsPath}/**/*.sol` }],
				diagnosticCollectionName: 'solidity-language-server',
				workspaceFolder: folder,
				outputChannel: outputChannel
			};

			// Create the language client and start the client.
			// Start the client. This will also launch the server
			const client = new LanguageClient('solidity-language-server', 'Solidity Language Server', serverOptions, clientOptions);

			client.start();
			clients.set(folder.uri.toString(), client);
		}
	}

	workspace.onDidOpenTextDocument(didOpenTextDocument);
	workspace.textDocuments.forEach(didOpenTextDocument);
	workspace.onDidChangeWorkspaceFolders(event => {
		for (const folder of event.removed) {
			const client = clients.get(folder.uri.toString());

			if (client) {
				clients.delete(folder.uri.toString());
				client.stop();
			}
		}
	});
}

export function deactivate(): Thenable<void> {
	const promises: Thenable<void>[] = [];

	for (const client of clients.values()) {
		promises.push(client.stop());
	}

	return Promise.all(promises).then(() => undefined);
}
