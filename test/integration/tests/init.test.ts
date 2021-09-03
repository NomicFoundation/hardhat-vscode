'use strict';

import * as path from 'path';
import * as assert from 'assert';
import * as vscode from 'vscode';
import * as lsclient from 'vscode-languageclient/node';

import { activate, getDocUri } from '../common/helper';
import { IndexFileData } from '../common/types';
import { NavigationProvider } from '../services/NavigationProvider';

suite('Client integration', () => {
	let client!: lsclient.LanguageClient;
	let middleware: lsclient.Middleware;
	let tokenSource!: vscode.CancellationTokenSource;
	let docUri!: vscode.Uri;

	suiteSetup(async () => {
		// Move this logic to client.ts in root of test files
		docUri = getDocUri('test.sol');
		await activate(docUri);

		tokenSource = new vscode.CancellationTokenSource();

		const serverModule = path.join(__dirname, '..', '..', '..', 'server', 'out', 'server.js');
		const serverOptions: lsclient.ServerOptions = {
			run: { module: serverModule, transport: lsclient.TransportKind.ipc },
			debug: { module: serverModule, transport: lsclient.TransportKind.ipc, options: { execArgv: ['--nolazy', '--inspect=6014'] } }
		};

		middleware = {};
		const clientOptions: lsclient.LanguageClientOptions = {
			documentSelector: [{ scheme: 'file', language: 'solidity' }],
			synchronize: {
				fileEvents: vscode.workspace.createFileSystemWatcher('**/.sol')
			},
			middleware
		};

		client = new lsclient.LanguageClient(
			'testSolidityLanguageServer',
			'Test Solidity Language Server',
			serverOptions,
			clientOptions
		);

		client.start();

		await client.onReady();

		// Wait for analyzer to indexing all files
		const promise = new Promise<void>(resolve => {
			client.onNotification("custom/indexingFile", (data: IndexFileData) => {
				if (data.current === data.total) {
					resolve();
				}
			});
		});

		await promise;
	});

	suiteTeardown(async () => {
		await client.stop();
	});

	test('InitializeResult', () => {
		const expected = {
			capabilities: {
				textDocumentSync: 2,
				completionProvider: {
					triggerCharacters: [
						'.', '/'
					]
				},
				definitionProvider: true,
				typeDefinitionProvider: true,
				referencesProvider: true,
				implementationProvider: true,
				renameProvider: true,
				workspace: {
					workspaceFolders: {
						supported: true
					}
				}
			}
		};

		assert.deepStrictEqual(client.initializeResult, expected);
	});
});
