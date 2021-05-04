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
		assert.strictEqual(actual.path, expected.path);
	}

	function isDefined<T>(value: T | undefined | null): asserts value is Exclude<T, undefined | null> {
		if (value === undefined || value === null) {
			throw new Error(`Value is null or undefined`);
		}
	}

	function isInstanceOf<T>(value: T, clazz: any): asserts value is Exclude<T, undefined | null> {
		assert.ok(value instanceof clazz);
	}

	function isArray<T>(value: Array<T> | undefined | null, clazz: any, length = 1): asserts value is Array<T> {
		assert.ok(Array.isArray(value), `value is array`);
		assert.strictEqual(value!.length, length, 'value has given length');

		if (length > 0) {
			assert.ok(value![0] instanceof clazz);
		}
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

		isArray(results, vscode.Location);
		for (const result of results) {
			isInstanceOf(result, vscode.Location);
			uriEqual(result.uri, uri);
			rangeEqual(result.range, 15, 4, 18, 4);
		}
	});

	test('Find All References', async () => {
		const expectedResults: vscode.Location[] = JSON.parse('[{"uri":{"$mid":1,"path":"/Users/riphal/Documents/Tenderly/vscode-solidity/client/tests/test_files/test.sol","scheme":"file"},"range":[{"line":27,"character":4},{"line":27,"character":40}]},{"uri":{"$mid":1,"path":"/Users/riphal/Documents/Tenderly/vscode-solidity/client/tests/test_files/test.sol","scheme":"file"},"range":[{"line":41,"character":12},{"line":41,"character":21}]},{"uri":{"$mid":1,"path":"/Users/riphal/Documents/Tenderly/vscode-solidity/client/tests/test_files/test.sol","scheme":"file"},"range":[{"line":104,"character":12},{"line":104,"character":21}]},{"uri":{"$mid":1,"path":"/Users/riphal/Documents/Tenderly/vscode-solidity/client/tests/test_files/test.sol","scheme":"file"},"range":[{"line":124,"character":8},{"line":124,"character":17}]},{"uri":{"$mid":1,"path":"/Users/riphal/Documents/Tenderly/vscode-solidity/client/tests/test_files/test.sol","scheme":"file"},"range":[{"line":133,"character":29},{"line":133,"character":38}]},{"uri":{"$mid":1,"path":"/Users/riphal/Documents/Tenderly/vscode-solidity/client/tests/test_files/test.sol","scheme":"file"},"range":[{"line":134,"character":16},{"line":134,"character":25}]},{"uri":{"$mid":1,"path":"/Users/riphal/Documents/Tenderly/vscode-solidity/client/tests/test_files/test.sol","scheme":"file"},"range":[{"line":135,"character":35},{"line":135,"character":44}]},{"uri":{"$mid":1,"path":"/Users/riphal/Documents/Tenderly/vscode-solidity/client/tests/test_files/test.sol","scheme":"file"},"range":[{"line":147,"character":22},{"line":147,"character":31}]}]');

		const provider = client.getFeature(lsclient.ReferencesRequest.method).getProvider(document);
		isDefined(provider);

		const position: vscode.Position = new vscode.Position(41, 16);
		const results = (await provider.provideReferences(
			document,
			position,
			{
				includeDeclaration: true
			},
			tokenSource.token
		)) as vscode.Location[];

		isArray(results, vscode.Location, 8);
		for (let i = 0; i < results.length; i++) {
			isInstanceOf(results[i], vscode.Location);
			uriEqual(results[i].uri, expectedResults[i].uri);
			rangeEqual(
				results[i].range,
				expectedResults[i].range[0].line,
				expectedResults[i].range[0].character,
				expectedResults[i].range[1].line,
				expectedResults[i].range[1].character
			);
		}
	});

	test('Do Rename', async () => {
		// TO-DO: Impement Do Rename
	});
});
