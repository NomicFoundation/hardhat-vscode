'use strict';

import * as fs from 'fs';
import * as path from 'path';
import * as assert from 'assert';
import * as vscode from 'vscode';
import * as lsclient from 'vscode-languageclient/node';

import {
	activate, changeDocument, getDocUri, document, rangeEqual,
	uriEqual, isDefined, isInstanceOf, isArray
} from './helper';

type IndexFileData = {
	path: string,
	current: number,
	total: number,
};

suite('Client integration', () => {
	let client!: lsclient.LanguageClient;
	let middleware: lsclient.Middleware;
	let tokenSource!: vscode.CancellationTokenSource;
	let docUri!: vscode.Uri;

	const integrationSamples = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', '..', 'test', 'integration', 'integration.test.json'), 'utf8'));
	const integrationTests = {
		doDefinitionRequest,
		doTypeDefinitionRequest,
		doReferencesRequest,
		doImplementationRequest,
		doRenameRequest,
	};

	suiteSetup(async () => {
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

	for (const sample of integrationSamples) {
		test(sample.title, async () => {
			docUri = getDocUri(sample.uri);
			await changeDocument(docUri);

			const fn = integrationTests[`do${sample.action}`];
			if (!fn) {
				throw new Error("Action request not implemented!");
			}

			await fn(client, tokenSource, sample);
		});
	}
});

async function doDefinitionRequest(client: lsclient.LanguageClient, tokenSource: vscode.CancellationTokenSource, sample: any): Promise<void> {
	const provider = client.getFeature(lsclient.DefinitionRequest.method).getProvider(document);
	isDefined(provider);

	const position = new vscode.Position(sample.position.line, sample.position.character);
	const result = (await provider.provideDefinition(document, position, tokenSource.token)) as vscode.Location;

	isInstanceOf(result, vscode.Location);
	uriEqual(result.uri, sample.expected.uri);
	rangeEqual(
		result.range,
		sample.expected.range[0].line,
		sample.expected.range[0].character,
		sample.expected.range[1].line,
		sample.expected.range[1].character
	);
}

async function doTypeDefinitionRequest(client: lsclient.LanguageClient, tokenSource: vscode.CancellationTokenSource, sample: any): Promise<void> {
	const provider = client.getFeature(lsclient.TypeDefinitionRequest.method).getProvider(document);
	isDefined(provider);

	const position = new vscode.Position(sample.position.line, sample.position.character);
	const results = (await provider.provideTypeDefinition(document, position, tokenSource.token)) as vscode.Location[];

	isArray(results, vscode.Location, sample.expected.length);
	for (let i = 0; i < results.length; i++) {
		const result = results[i];
		const expected = sample.expected[i];

		isInstanceOf(result, vscode.Location);
		uriEqual(result.uri, expected.uri);
		rangeEqual(
			result.range,
			expected.range[0].line,
			expected.range[0].character,
			expected.range[1].line,
			expected.range[1].character
		);
	}
}

async function doReferencesRequest(client: lsclient.LanguageClient, tokenSource: vscode.CancellationTokenSource, sample: any): Promise<void> {
	const provider = client.getFeature(lsclient.ReferencesRequest.method).getProvider(document);
	isDefined(provider);

	const position = new vscode.Position(sample.position.line, sample.position.character);
	const results = (await provider.provideReferences(
		document,
		position,
		{
			includeDeclaration: true
		},
		tokenSource.token
	)) as vscode.Location[];

	isArray(results, vscode.Location, sample.expected.length);
	for (let i = 0; i < results.length; i++) {
		const result = results[i];
		const expected = sample.expected[i];

		isInstanceOf(result, vscode.Location);
		uriEqual(result.uri, expected.uri);
		rangeEqual(
			result.range,
			expected.range[0].line,
			expected.range[0].character,
			expected.range[1].line,
			expected.range[1].character
		);
	}
}

async function doImplementationRequest(client: lsclient.LanguageClient, tokenSource: vscode.CancellationTokenSource, sample: any): Promise<void> {
	const provider = client.getFeature(lsclient.ImplementationRequest.method).getProvider(document);
	isDefined(provider);

	const position = new vscode.Position(sample.position.line, sample.position.character);
	const results = (await provider.provideImplementation(
		document,
		position,
		tokenSource.token
	)) as vscode.Location[];
	
	isArray(results, vscode.Location, sample.expected.length);
	for (let i = 0; i < results.length; i++) {
		const result = results[i];
		const expected = sample.expected[i];

		isInstanceOf(result, vscode.Location);
		uriEqual(result.uri, expected.uri);
		rangeEqual(
			result.range,
			expected.range[0].line,
			expected.range[0].character,
			expected.range[1].line,
			expected.range[1].character
		);
	}
}

async function doRenameRequest(client: lsclient.LanguageClient, tokenSource: vscode.CancellationTokenSource, sample: any): Promise<void> {
	const provider = client.getFeature(lsclient.RenameRequest.method).getProvider(document);
	isDefined(provider);

	const position = new vscode.Position(sample.position.line, sample.position.character);
	const renameResult = await provider.provideRenameEdits(document, position, 'newName', tokenSource.token);

	isInstanceOf(renameResult, vscode.WorkspaceEdit);
	for (let i = 0; i < renameResult.entries().length; i++) {
		const results = renameResult.entries()[i];
		const expected = sample.expected[i];

		if (results.length !== 2) {
			throw new Error(`Result [vscode.Uri, vscode.TextEdit[]].length must be 2`);
		}

		isInstanceOf(results[0], vscode.Uri);
		uriEqual(results[0], expected[0]);

		const textEdits = results[1];
		for (let j = 0; j < textEdits.length; j++) {
			isInstanceOf(textEdits[j], vscode.TextEdit);
			assert.strictEqual(textEdits[j].newText, expected[1][j].newText);
			rangeEqual(
				textEdits[j].range,
				expected[1][j].range[0].line,
				expected[1][j].range[0].character,
				expected[1][j].range[1].line,
				expected[1][j].range[1].character
			);
		}
	}
}
