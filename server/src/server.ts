/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import {
	createConnection, TextDocuments, Diagnostic, DiagnosticSeverity,
	ProposedFeatures, InitializeParams, DidChangeConfigurationNotification,
	CompletionItem, CompletionItemKind, TextDocumentPositionParams,
	TextDocumentSyncKind, InitializeResult
} from 'vscode-languageserver/node';

import { MarkupKind } from 'vscode-languageserver-types';
import { TextDocument } from 'vscode-languageserver-textdocument';

import { languageServer } from './services';

// Create a connection for the server, using Node's IPC as a transport.
// Also include all preview / proposed LSP features.
const connection = createConnection(ProposedFeatures.all);

// Create a simple text document manager.
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

let hasConfigurationCapability = false;
let hasWorkspaceFolderCapability = false;
let hasDiagnosticRelatedInformationCapability = false;

connection.onInitialize((params: InitializeParams) => {
	console.log('server onInitialize');

	const capabilities = params.capabilities;

	// Does the client support the `workspace/configuration` request?
	// If not, we fall back using global settings.
	hasConfigurationCapability = !!(
		capabilities.workspace && !!capabilities.workspace.configuration
	);
	hasWorkspaceFolderCapability = !!(
		capabilities.workspace && !!capabilities.workspace.workspaceFolders
	);
	hasDiagnosticRelatedInformationCapability = !!(
		capabilities.textDocument &&
		capabilities.textDocument.publishDiagnostics &&
		capabilities.textDocument.publishDiagnostics.relatedInformation
	);

	const result: InitializeResult = {
		capabilities: {
			textDocumentSync: TextDocumentSyncKind.Incremental,
			// Tell the client that this server supports code completion.
			completionProvider: {
				resolveProvider: true
			},
			// hoverProvider: true,
			definitionProvider: true,
			typeDefinitionProvider: true,
			referencesProvider: true,
			implementationProvider: true,
			renameProvider: true
		}
	};

	if (hasWorkspaceFolderCapability) {
		result.capabilities.workspace = {
			workspaceFolders: {
				supported: true
			}
		};
	}

	return result;
});

connection.onInitialized(() => {
	console.log('server onInitialized');

	if (hasConfigurationCapability) {
		// Register for all configuration changes.
		connection.client.register(DidChangeConfigurationNotification.type, undefined);
	}
	if (hasWorkspaceFolderCapability) {
		connection.workspace.onDidChangeWorkspaceFolders(_event => {
			connection.console.log('Workspace folder change event received.');
		});
	}
});

// The example settings
interface ExampleSettings {
	maxNumberOfProblems: number;
}

// The global settings, used when the `workspace/configuration` request is not supported by the client.
// Please note that this is not the case when using this server with the client provided in this example
// but could happen with other clients.
const defaultSettings: ExampleSettings = { maxNumberOfProblems: 1000 };
let globalSettings: ExampleSettings = defaultSettings;

// Cache the settings of all open documents
const documentSettings: Map<string, Thenable<ExampleSettings>> = new Map();

connection.onDidChangeConfiguration(change => {
	console.log('server onDidChangeConfiguration');

	if (hasConfigurationCapability) {
		// Reset all cached document settings
		documentSettings.clear();
	} else {
		globalSettings = <ExampleSettings>(
			(change.settings.languageServerExample || defaultSettings)
		);
	}
});

// Only keep settings for open documents
documents.onDidClose(e => {
	console.log('server onDidClose');

	documentSettings.delete(e.document.uri);
});

// The content of a text document has changed. This event is emitted
// when the text document first opened or when its content has changed.
documents.onDidChangeContent(change => {
	console.log('server onDidChangeContent');
});

connection.onDidChangeWatchedFiles(_change => {
	console.log('server onDidChangeWatchedFiles');

	// Monitored files have change in VSCode
	connection.console.log('We received an file change event');
});

// This handler provides the initial list of the completion items.
connection.onCompletion(
	(_textDocumentPosition: TextDocumentPositionParams): CompletionItem[] => {
		console.log('server onDidChangeWatchedFiles');
		console.log(_textDocumentPosition);
		// The pass parameter contains the position of the text document in
		// which code complete got requested. For the example we ignore this
		// info and always provide the same completion items.
		return [
			{
				label: 'TypeScript',
				kind: CompletionItemKind.Text,
				data: 1
			},
			{
				label: 'JavaScript',
				kind: CompletionItemKind.Text,
				data: 2
			}
		];
	}
);

// This handler resolves additional information for the item selected in
// the completion list.
connection.onCompletionResolve(
	(item: CompletionItem): CompletionItem => {
		console.log('server onCompletionResolve');

		if (item.data === 1) {
			item.detail = 'TypeScript details';
			item.documentation = 'TypeScript documentation';
		} else if (item.data === 2) {
			item.detail = 'JavaScript details';
			item.documentation = 'JavaScript documentation';
		}
		return item;
	}
);


// Add hover example
connection.onHover(params => {
	return {
		contents: {
			kind: MarkupKind.Markdown,
			value: [
				'```typescript',
				'function validate(document: TextDocument): Diagnostic[]',
				'```',
				'___',
				'Some doc',
				'',
				'_@param_ `document` '
			].join('\n')
		}
	};
});

connection.onDefinition(params => {
	console.log("onDefinition");
	const document = documents.get(params.textDocument.uri);

	if (document) {
		const analyzeTree = languageServer.analyzeDocument(document.getText(), document.uri);

		if (analyzeTree) {
			return languageServer.findDefinition(params.position, analyzeTree);
		}
	}
});

connection.onTypeDefinition(params => {
	console.log("onTypeDefinition");
	const document = documents.get(params.textDocument.uri);

	if (document) {
		const analyzeTree = languageServer.analyzeDocument(document.getText(), document.uri);

		if (analyzeTree) {
			return languageServer.findTypeDefinition(params.position, analyzeTree);
		}
	}
});

connection.onReferences(params => {
	console.log("onReferences");
	const document = documents.get(params.textDocument.uri);
	
	if (document) {
		const analyzeTree = languageServer.analyzeDocument(document.getText(), document.uri);

		if (analyzeTree) {
			return languageServer.findReferences(params.position, analyzeTree);
		}
	}
});

connection.onImplementation(params => {
	console.log("onImplementation");
	const document = documents.get(params.textDocument.uri);
	
	if (document) {
		const analyzeTree = languageServer.analyzeDocument(document.getText(), document.uri);

		if (analyzeTree) {
			return languageServer.findImplementation(params.position, analyzeTree);
		}
	}
});

connection.onRenameRequest(params => {
	console.log("onRenameRequest");
	const document = documents.get(params.textDocument.uri);

	if (document) {
		const analyzeTree = languageServer.analyzeDocument(document.getText(), document.uri);

		if (analyzeTree) {
			return languageServer.doRename(document, params.position, params.newName, analyzeTree);
		}
	}
});

// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);

// Listen on the connection
connection.listen();
