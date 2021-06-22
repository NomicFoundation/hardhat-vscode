/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import {
	createConnection, TextDocuments, ProposedFeatures, InitializeParams,
	DidChangeConfigurationNotification, CompletionItem, CompletionList,
	TextDocumentPositionParams, TextDocumentSyncKind, InitializeResult
} from 'vscode-languageserver/node';

import { MarkupKind } from 'vscode-languageserver-types';
import { TextDocument } from 'vscode-languageserver-textdocument';

import { getUriFromDocument, debounce } from './utils';
import { getLanguageServer, LanguageService } from './services';

// Create a connection for the server, using Node's IPC as a transport.
// Also include all preview / proposed LSP features.
const connection = createConnection(ProposedFeatures.all);

// Create a simple text document manager.
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

let hasConfigurationCapability = false;
let hasWorkspaceFolderCapability = false;
let hasDiagnosticRelatedInformationCapability = false;
let languageServer: LanguageService;

connection.onInitialize((params: InitializeParams) => {
	console.log('server onInitialize');

	const rootPath = params.workspaceFolders ? params.workspaceFolders[0].uri : undefined;

	languageServer = getLanguageServer(rootPath);

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


// ---------------------------------------------------------------------------------
function analyzeFunc(uri: string) {
	console.log('debounced onDidChangeContent');

	try {
		const document = documents.get(uri);

		if (document) {
			const documentURI = getUriFromDocument(document);
			languageServer.analyzeDocument(document.getText(), documentURI);
		}	
	} catch (err) {
		console.error(err);
	}
}

const debounceAnalyzeDocument = debounce(analyzeFunc, 500);

// The content of a text document has changed. This event is emitted
// when the text document first opened or when its content has changed.
documents.onDidChangeContent(change => {
	console.log('server onDidChangeContent');

	debounceAnalyzeDocument(change.document.uri);
});

connection.onDidChangeWatchedFiles(_change => {
	console.log('server onDidChangeWatchedFiles');

	// Monitored files have change in VSCode
	connection.console.log('We received an file change event');
});

// This handler provides the initial list of the completion items.
connection.onCompletion(
	(_textDocumentPosition: TextDocumentPositionParams): CompletionList | undefined => {
		console.log('server onCompletion', _textDocumentPosition);
		// The pass parameter contains the position of the text document in
		// which code complete got requested. For the example we ignore this
		// info and always provide the same completion items.

		const documentURI = getUriFromDocument(_textDocumentPosition.textDocument);
		const documentAnalyzer = languageServer.getDocumentAnalyzer(documentURI);

		if (documentAnalyzer) {
			return languageServer.doComplete(_textDocumentPosition.position, documentAnalyzer);
		}
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
	try {
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
	} catch (err) {
		console.error(err);
	}
});

connection.onDefinition(params => {
	console.log("onDefinition");

	try {
		const document = documents.get(params.textDocument.uri);

		if (document) {
			const documentURI = getUriFromDocument(document);
			const analyzeTree = languageServer.analyzeDocument(document.getText(), documentURI);

			if (analyzeTree) {
				return languageServer.findDefinition(documentURI, params.position, analyzeTree);
			}
		}	
	} catch (err) {
		console.error(err);
	}
});

connection.onTypeDefinition(params => {
	console.log("onTypeDefinition");

	try {
		const document = documents.get(params.textDocument.uri);

		if (document) {
			const documentURI = getUriFromDocument(document);
			const analyzeTree = languageServer.analyzeDocument(document.getText(), documentURI);
	
			if (analyzeTree) {
				return languageServer.findTypeDefinition(documentURI, params.position, analyzeTree);
			}
		}
	} catch (err) {
		console.error(err);
	}

});

connection.onReferences(params => {
	console.log("onReferences");

	try {
		const document = documents.get(params.textDocument.uri);
	
		if (document) {
			const documentURI = getUriFromDocument(document);
			const analyzeTree = languageServer.analyzeDocument(document.getText(), documentURI);
	
			if (analyzeTree) {
				return languageServer.findReferences(documentURI, params.position, analyzeTree);
			}
		}
	} catch (err) {
		console.error(err);
	}

});

connection.onImplementation(params => {
	console.log("onImplementation");

	try {
		const document = documents.get(params.textDocument.uri);
	
		if (document) {
			const documentURI = getUriFromDocument(document);
			const analyzeTree = languageServer.analyzeDocument(document.getText(), documentURI);
	
			if (analyzeTree) {
				return languageServer.findImplementation(documentURI, params.position, analyzeTree);
			}
		}
	} catch (err) {
		console.error(err);
	}
});

connection.onRenameRequest(params => {
	console.log("onRenameRequest");

	try {
		const document = documents.get(params.textDocument.uri);

		if (document) {
			const documentURI = getUriFromDocument(document);
			const analyzeTree = languageServer.analyzeDocument(document.getText(), documentURI);
	
			if (analyzeTree) {
				return languageServer.doRename(documentURI, document, params.position, params.newName, analyzeTree);
			}
		}
	} catch (err) {
		console.error(err);
	}
});

// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);

// Listen on the connection
connection.listen();
