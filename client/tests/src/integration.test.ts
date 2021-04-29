'use strict';

import * as path from 'path';
import * as assert from 'assert';
import * as vscode from 'vscode';
import * as lsclient from 'vscode-languageclient/node';

suite('Client integration', () => {
	let client!: lsclient.LanguageClient;
	let middleware: lsclient.Middleware;
	let uri!: vscode.Uri;
	let document!: vscode.TextDocument;
	let tokenSource!: vscode.CancellationTokenSource;

	suiteSetup(async () => {
		uri = vscode.Uri.parse(path.join(__dirname, '..', 'test_files', 'test.sol'));
		document = await vscode.workspace.openTextDocument(uri);

		tokenSource = new vscode.CancellationTokenSource();

		const serverModule = path.join(__dirname, '..', '..', '..' ,'server', 'out', 'server.js');
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
	});

	suiteTeardown(async () => {
		await client.stop();
	});

	function rangeEqual(range: vscode.Range, sl: number, sc: number, el: number, ec: number): void {
		assert.strictEqual(range.start.line, sl);
		assert.strictEqual(range.start.character, sc);
		assert.strictEqual(range.end.line, el);
		assert.strictEqual(range.end.character, ec);
	}

	function uriEqual(actual: vscode.Uri, expected: vscode.Uri): void {
		assert.strictEqual(actual.toString(), expected.toString());
	}

	function isDefined<T>(value: T | undefined | null): asserts value is Exclude<T, undefined | null> {
		if (value === undefined || value === null) {
			throw new Error(`Value is null or undefined`);
		}
	}

	function isInstanceOf<T>(value: T, clazz: any): asserts value is Exclude<T, undefined | null> {
		assert.ok(value instanceof clazz);
	}

	test('InitializeResult', () => {
		const expected = {
			capabilities: {
				textDocumentSync: 2,
				completionProvider: { resolveProvider: true },
				definitionProvider: true,
				typeDefinitionProvider: true,
				renameProvider: true,
				referencesProvider: true,
				workspace: {
					workspaceFolders: {
						supported: true
					}
				}
			}
		};

		assert.deepStrictEqual(client.initializeResult, expected);
	});

	test('Goto Definition', async () => {
		const provider = client.getFeature(lsclient.DefinitionRequest.method).getProvider(document);
		isDefined(provider);

		const position: vscode.Position = new vscode.Position(32, 31);
		const result = (await provider.provideDefinition(document, position, tokenSource.token)) as vscode.Location;

		isInstanceOf(result, vscode.Location);
		uriEqual(result.uri, uri);
		rangeEqual(result.range, 8, 8, 8, 19);
	});

	test('Goto Type Definition', async () => {
		const provider = client.getFeature(lsclient.TypeDefinitionRequest.method).getProvider(document);
		isDefined(provider);

		const position: vscode.Position = new vscode.Position(41, 16);
		const results = (await provider.provideTypeDefinition(document, position, tokenSource.token)) as vscode.Location[];

		for (const result of results) {
			isInstanceOf(result, vscode.Location);
			uriEqual(result.uri, uri);
			rangeEqual(result.range, 15, 4, 18, 4);
		}
	});

	test('Find All References', async () => {
		// TO-DO: Impement Find All References
	});

	test('Do Rename', async () => {
		// TO-DO: Impement Do Rename
	});
});
