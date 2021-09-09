import "module-alias/register";

import {
	createConnection, TextDocuments, ProposedFeatures, InitializeParams,
	CompletionList, CompletionParams, TextDocumentSyncKind, InitializeResult
} from 'vscode-languageserver/node';

import { TextDocument } from 'vscode-languageserver-textdocument';

import { IndexFileData, eventEmitter as em } from '@common/event';
import { getUriFromDocument, decodeUriAndRemoveFilePrefix, debounce } from './utils';
import { LanguageService } from './parser';

// Create a connection for the server, using Node's IPC as a transport.
// Also include all preview / proposed LSP features.
const connection = createConnection(ProposedFeatures.all);

// Create a simple text document manager.
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

let rootUri: string;
let hasWorkspaceFolderCapability = false;
let languageServer: LanguageService;

const debounceAnalyzeDocument: { [uri: string]: (uri: string) => void } = {};
const debounceValidateDocument: { [uri: string]: (document: TextDocument) => void } = {};

connection.onInitialize((params: InitializeParams) => {
	console.log('server onInitialize');

	/**
	 * We know that rootUri is deprecated but we need it.
	 * We will monitor https://github.com/microsoft/vscode-extension-samples/issues/207 issue,
	 * so when it will be resolved we can update how we get rootUri.
	 */
	if (params.rootUri) {
		rootUri = decodeUriAndRemoveFilePrefix(params.rootUri);
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

	languageServer = new LanguageService(rootUri);

	if (hasWorkspaceFolderCapability) {
		connection.workspace.onDidChangeWorkspaceFolders(_event => {
			connection.console.log('Workspace folder change event received.');
			console.log(_event);
		});
	}
});

em.on('IndexingFile', (data: IndexFileData) => {
	connection.sendNotification("custom/indexingFile", data);
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

async function validateTextDocument(document: TextDocument): Promise<void> {
	console.log("validateTextDocument");

	try {
		const documentURI = getUriFromDocument(document);
		const diagnostics = await languageServer.solidityValidation.doValidation(documentURI, document);

		// Send the calculated diagnostics to VSCode, but only for the file over which we called validation.
		for (const diagnosticUri of Object.keys(diagnostics)) {
			if (documentURI.includes(diagnosticUri)) {
				connection.sendDiagnostics({
					uri: document.uri,
					diagnostics: diagnostics[diagnosticUri]
				});

				return;
			}
		}
		
		connection.sendDiagnostics({
			uri: document.uri,
			diagnostics: []
		});
	} catch (err) {
		console.error(err);
	}
}

// The content of a text document has changed. This event is emitted
// when the text document first opened or when its content has changed.
documents.onDidChangeContent(change => {
	console.log('server onDidChangeContent');

	if (!debounceAnalyzeDocument[change.document.uri]) {
		debounceAnalyzeDocument[change.document.uri] = debounce(analyzeFunc, 500);
	}
	debounceAnalyzeDocument[change.document.uri](change.document.uri);


	if (!debounceValidateDocument[change.document.uri]) {
		debounceValidateDocument[change.document.uri] = debounce(validateTextDocument, 500);
	}
	debounceValidateDocument[change.document.uri](change.document);
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
					return languageServer.solidityCompletion.doComplete(params.position, documentAnalyzer);
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
