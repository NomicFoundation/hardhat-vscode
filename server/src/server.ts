/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import {
	createConnection, TextDocuments, ProposedFeatures, InitializeParams,
	CompletionList, CompletionParams, TextDocumentSyncKind, InitializeResult
} from 'vscode-languageserver/node';

import { TextDocument } from 'vscode-languageserver-textdocument';

import { getUriFromDocument, decodeUriAndRemoveFilePrefix, debounce } from './utils';
import { LanguageService } from './services';

// Create a connection for the server, using Node's IPC as a transport.
// Also include all preview / proposed LSP features.
const connection = createConnection(ProposedFeatures.all);

// Create a simple text document manager.
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

let hasWorkspaceFolderCapability = false;
let languageServer: LanguageService;

connection.onInitialize((params: InitializeParams) => {
	console.log('server onInitialize');

	/**
	 * We know that rootUri is deprecated but we need it.
	 * We will monitor https://github.com/microsoft/vscode-extension-samples/issues/207 issue,
	 * so when it will be resolved we can update how we get rootUri.
	 */
	if (params.rootUri) {
		const uri = decodeUriAndRemoveFilePrefix(params.rootUri);
		languageServer = new LanguageService(uri);
	}

	const capabilities = params.capabilities;
	
	hasWorkspaceFolderCapability = !!(
		capabilities.workspace && !!capabilities.workspace.workspaceFolders
	);

	const result: InitializeResult = {
		capabilities: {
			textDocumentSync: TextDocumentSyncKind.Incremental,
			// Tell the client that this server supports code completion.
			completionProvider: {
				resolveProvider: true,
                triggerCharacters: [
					'.', '/'
				]
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

	if (hasWorkspaceFolderCapability) {
		connection.workspace.onDidChangeWorkspaceFolders(_event => {
			connection.console.log('Workspace folder change event received.');
			console.log(_event);
		});
	}
});

function analyzeFunc(uri: string): void {
	console.log('debounced onDidChangeContent');

	try {
		const document = documents.get(uri);

		if (document) {
			const documentURI = getUriFromDocument(document);
			languageServer.analyzer.analyzeDocument(document.getText(), documentURI);
		}	
	} catch (err) {
		console.error(err);
	}
}

// The content of a text document has changed. This event is emitted
// when the text document first opened or when its content has changed.
documents.onDidChangeContent(change => {
	console.log('server onDidChangeContent');

	const debounceAnalyzeDocument: { [uri: string]: (uri: string) => void } = {};
	if (!debounceAnalyzeDocument[change.document.uri]) {
		debounceAnalyzeDocument[change.document.uri] = debounce(analyzeFunc, 500);
	}

	debounceAnalyzeDocument[change.document.uri](change.document.uri);
});

// This handler provides the initial list of the completion items.
connection.onCompletion(
	(params: CompletionParams): CompletionList | undefined => {
		console.log('server onCompletion', params);

		try {
			const document = documents.get(params.textDocument.uri);

			if (document) {
				const documentText = document.getText();
				let newDocumentText = documentText;

				// Hack if triggerCharacter was "." then we insert ";" because the tolerance mode @solidity-parser/parser crashes as we type.
				// This only happens if there is no ";" at the end of the line.
				if (params.context?.triggerCharacter === ".") {
					const cursorOffset = document.offsetAt(params.position);
					const eofOffset = documentText.indexOf("\n", cursorOffset) > cursorOffset ? documentText.indexOf("\n", cursorOffset) : cursorOffset;
					newDocumentText = documentText.slice(0, cursorOffset) + "_" + documentText.slice(cursorOffset, eofOffset) + ";";
				}

				const documentURI = getUriFromDocument(document);
				languageServer.analyzer.analyzeDocument(newDocumentText, documentURI);

				const documentAnalyzer = languageServer.analyzer.getDocumentAnalyzer(documentURI);
				if (documentAnalyzer) {
					return languageServer.solidityCompletion.doComplete(documentAnalyzer.rootPath, params.position, documentAnalyzer);
				}
			}
		} catch (err) {
			console.error(err);
		}
	}
);

connection.onDefinition(params => {
	console.log("onDefinition");

	try {
		const document = documents.get(params.textDocument.uri);

		if (document) {
			const documentURI = getUriFromDocument(document);
			const documentAnalyzer = languageServer.analyzer.getDocumentAnalyzer(documentURI);

			if (documentAnalyzer.isAnalyzed) {
				return languageServer.solidityNavigation.findDefinition(documentURI, params.position, documentAnalyzer.analyzerTree.tree);
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
			const documentAnalyzer = languageServer.analyzer.getDocumentAnalyzer(documentURI);

			if (documentAnalyzer.isAnalyzed) {
				return languageServer.solidityNavigation.findTypeDefinition(documentURI, params.position, documentAnalyzer.analyzerTree.tree);
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
			const documentAnalyzer = languageServer.analyzer.getDocumentAnalyzer(documentURI);

			if (documentAnalyzer.isAnalyzed) {
				return languageServer.solidityNavigation.findReferences(documentURI, params.position, documentAnalyzer.analyzerTree.tree);
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
			const documentAnalyzer = languageServer.analyzer.getDocumentAnalyzer(documentURI);

			if (documentAnalyzer.isAnalyzed) {
				return languageServer.solidityNavigation.findImplementation(documentURI, params.position, documentAnalyzer.analyzerTree.tree);
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
			const documentAnalyzer = languageServer.analyzer.getDocumentAnalyzer(documentURI);

			if (documentAnalyzer.isAnalyzed) {
				return languageServer.solidityNavigation.doRename(documentURI, document, params.position, params.newName, documentAnalyzer.analyzerTree.tree);
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
