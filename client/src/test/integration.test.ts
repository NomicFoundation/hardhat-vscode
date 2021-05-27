'use strict';

import * as path from 'path';
import * as assert from 'assert';
import * as vscode from 'vscode';
import * as lsclient from 'vscode-languageclient/node';

import {
	activate, changeDocument, getDocUri, document, rangeEqual,
	uriEqual, isDefined, isInstanceOf, isArray
} from './helper';

suite('Client integration', () => {
	let client!: lsclient.LanguageClient;
	let middleware: lsclient.Middleware;
	let tokenSource!: vscode.CancellationTokenSource;
	let docUri!: vscode.Uri;

	suiteSetup(async () => {
		docUri = getDocUri('test.sol');
		await activate(docUri);

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

	test('InitializeResult', () => {
		const expected = {
			capabilities: {
				textDocumentSync: 2,
				completionProvider: { resolveProvider: true },
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

	test('Goto Definition', async () => {
		docUri = getDocUri('test.sol');
		await changeDocument(docUri);

		const provider = client.getFeature(lsclient.DefinitionRequest.method).getProvider(document);
		isDefined(provider);

		const position: vscode.Position = new vscode.Position(32, 31);
		const result = (await provider.provideDefinition(document, position, tokenSource.token)) as vscode.Location;

		isInstanceOf(result, vscode.Location);
		uriEqual(result.uri, docUri);
		rangeEqual(result.range, 8, 8, 8, 19);
	});

	test('Goto Type Definition', async () => {
		docUri = getDocUri('test.sol');
		await changeDocument(docUri);

		const provider = client.getFeature(lsclient.TypeDefinitionRequest.method).getProvider(document);
		isDefined(provider);

		const position: vscode.Position = new vscode.Position(41, 16);
		const results = (await provider.provideTypeDefinition(document, position, tokenSource.token)) as vscode.Location[];

		isArray(results, vscode.Location);
		for (const result of results) {
			isInstanceOf(result, vscode.Location);
			uriEqual(result.uri, docUri);
			rangeEqual(result.range, 15, 11, 15, 19);
		}
	});

	test('Find References', async () => {
		docUri = getDocUri('test.sol');
		await changeDocument(docUri);

		const expectedResults: vscode.Location[] = JSON.parse('[{"uri":{"$mid":1,"path":"/Users/riphal/Documents/Tenderly/vscode-solidity/client/src/test/testFixture/test.sol","scheme":"file"},"range":[{"line":27,"character":22},{"line":27,"character":31}]},{"uri":{"$mid":1,"path":"/Users/riphal/Documents/Tenderly/vscode-solidity/client/src/test/testFixture/test.sol","scheme":"file"},"range":[{"line":41,"character":12},{"line":41,"character":21}]},{"uri":{"$mid":1,"path":"/Users/riphal/Documents/Tenderly/vscode-solidity/client/src/test/testFixture/test.sol","scheme":"file"},"range":[{"line":104,"character":12},{"line":104,"character":21}]},{"uri":{"$mid":1,"path":"/Users/riphal/Documents/Tenderly/vscode-solidity/client/src/test/testFixture/test.sol","scheme":"file"},"range":[{"line":124,"character":8},{"line":124,"character":17}]},{"uri":{"$mid":1,"path":"/Users/riphal/Documents/Tenderly/vscode-solidity/client/src/test/testFixture/test.sol","scheme":"file"},"range":[{"line":133,"character":29},{"line":133,"character":38}]},{"uri":{"$mid":1,"path":"/Users/riphal/Documents/Tenderly/vscode-solidity/client/src/test/testFixture/test.sol","scheme":"file"},"range":[{"line":134,"character":16},{"line":134,"character":25}]},{"uri":{"$mid":1,"path":"/Users/riphal/Documents/Tenderly/vscode-solidity/client/src/test/testFixture/test.sol","scheme":"file"},"range":[{"line":135,"character":35},{"line":135,"character":44}]},{"uri":{"$mid":1,"path":"/Users/riphal/Documents/Tenderly/vscode-solidity/client/src/test/testFixture/test.sol","scheme":"file"},"range":[{"line":147,"character":22},{"line":147,"character":31}]}]');

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

	test('Find Implementations', async () => {
		docUri = getDocUri('test1.sol');
		await changeDocument(docUri);

		const expectedResults: vscode.Location[] = JSON.parse('[{"uri":{"$mid":1,"path":"/Users/riphal/Documents/Tenderly/vscode-solidity/client/src/test/testFixture/test1.sol","scheme":"file"},"range":[{"line":11,"character":9},{"line":11,"character":10}]},{"uri":{"$mid":1,"path":"/Users/riphal/Documents/Tenderly/vscode-solidity/client/src/test/testFixture/test1.sol","scheme":"file"},"range":[{"line":33,"character":14},{"line":33,"character":15}]},{"uri":{"$mid":1,"path":"/Users/riphal/Documents/Tenderly/vscode-solidity/client/src/test/testFixture/test1.sol","scheme":"file"},"range":[{"line":48,"character":14},{"line":48,"character":15}]}]');

		const provider = client.getFeature(lsclient.ImplementationRequest.method).getProvider(document);
		isDefined(provider);

		const position: vscode.Position = new vscode.Position(11, 10);
		const results = (await provider.provideImplementation(
			document,
			position,
			tokenSource.token
		)) as vscode.Location[];
		
		isArray(results, vscode.Location, 3);

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
		docUri = getDocUri('test.sol');
		await changeDocument(docUri);

		const expectedResults: [vscode.Uri, vscode.TextEdit[]] = JSON.parse('[{"$mid":1,"external":"file:///Users/riphal/Documents/Tenderly/vscode-solidity/client/src/test/testFixture/test.sol","path":"/Users/riphal/Documents/Tenderly/vscode-solidity/client/src/test/testFixture/test.sol","scheme":"file"},[{"range":[{"line":27,"character":22},{"line":27,"character":31}],"newText":"newName"},{"range":[{"line":41,"character":12},{"line":41,"character":21}],"newText":"newName"},{"range":[{"line":104,"character":12},{"line":104,"character":21}],"newText":"newName"},{"range":[{"line":124,"character":8},{"line":124,"character":17}],"newText":"newName"},{"range":[{"line":133,"character":29},{"line":133,"character":38}],"newText":"newName"},{"range":[{"line":134,"character":16},{"line":134,"character":25}],"newText":"newName"},{"range":[{"line":135,"character":35},{"line":135,"character":44}],"newText":"newName"},{"range":[{"line":147,"character":22},{"line":147,"character":31}],"newText":"newName"}]]');
		const provider = client.getFeature(lsclient.RenameRequest.method).getProvider(document);
		isDefined(provider);

		const position: vscode.Position = new vscode.Position(41, 16);
		const renameResult = await provider.provideRenameEdits(document, position, 'newName', tokenSource.token);
		
		isInstanceOf(renameResult, vscode.WorkspaceEdit);
		for (const results of renameResult.entries()) {
			if (results.length !== 2) {
				throw new Error(`Result [vscode.Uri, vscode.TextEdit[]].length must be 2`);
			}

			isInstanceOf(results[0], vscode.Uri);
			uriEqual(results[0], expectedResults[0]);

			const textEdits = results[1];
			for (let i = 0; i < textEdits.length; i++) {
				isInstanceOf(textEdits[i], vscode.TextEdit);
				assert.strictEqual(textEdits[i].newText, expectedResults[1][i].newText);
				rangeEqual(
					textEdits[i].range,
					expectedResults[1][i].range[0].line,
					expectedResults[1][i].range[0].character,
					expectedResults[1][i].range[1].line,
					expectedResults[1][i].range[1].character
				);
			}
		}
	});
});
