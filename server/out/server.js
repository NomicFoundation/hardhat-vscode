"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
const node_1 = require("vscode-languageserver/node");
const vscode_languageserver_types_1 = require("vscode-languageserver-types");
const vscode_languageserver_textdocument_1 = require("vscode-languageserver-textdocument");
const out_1 = require("../../parser/out");
const finder_1 = require("../../parser/out/analizer/finder");
// Create a connection for the server, using Node's IPC as a transport.
// Also include all preview / proposed LSP features.
let connection = node_1.createConnection(node_1.ProposedFeatures.all);
// Create a simple text document manager.
let documents = new node_1.TextDocuments(vscode_languageserver_textdocument_1.TextDocument);
let hasConfigurationCapability = false;
let hasWorkspaceFolderCapability = false;
let hasDiagnosticRelatedInformationCapability = false;
connection.onInitialize((params) => {
    console.log('server onInitialize');
    let capabilities = params.capabilities;
    // Does the client support the `workspace/configuration` request?
    // If not, we fall back using global settings.
    hasConfigurationCapability = !!(capabilities.workspace && !!capabilities.workspace.configuration);
    hasWorkspaceFolderCapability = !!(capabilities.workspace && !!capabilities.workspace.workspaceFolders);
    hasDiagnosticRelatedInformationCapability = !!(capabilities.textDocument &&
        capabilities.textDocument.publishDiagnostics &&
        capabilities.textDocument.publishDiagnostics.relatedInformation);
    const result = {
        capabilities: {
            textDocumentSync: node_1.TextDocumentSyncKind.Incremental,
            // Tell the client that this server supports code completion.
            completionProvider: {
                resolveProvider: true
            },
            // hoverProvider: true,
            renameProvider: true,
            definitionProvider: true,
            typeDefinitionProvider: true,
            // implementationProvider: true,
            referencesProvider: true
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
        connection.client.register(node_1.DidChangeConfigurationNotification.type, undefined);
    }
    if (hasWorkspaceFolderCapability) {
        connection.workspace.onDidChangeWorkspaceFolders(_event => {
            connection.console.log('Workspace folder change event received.');
        });
    }
});
// The global settings, used when the `workspace/configuration` request is not supported by the client.
// Please note that this is not the case when using this server with the client provided in this example
// but could happen with other clients.
const defaultSettings = { maxNumberOfProblems: 1000 };
let globalSettings = defaultSettings;
// Cache the settings of all open documents
let documentSettings = new Map();
connection.onDidChangeConfiguration(change => {
    console.log('server onDidChangeConfiguration');
    if (hasConfigurationCapability) {
        // Reset all cached document settings
        documentSettings.clear();
    }
    else {
        globalSettings = ((change.settings.languageServerExample || defaultSettings));
    }
    // Revalidate all open text documents
    documents.all().forEach(validateTextDocument);
});
function getDocumentSettings(resource) {
    console.log('server getDocumentSettings');
    if (!hasConfigurationCapability) {
        return Promise.resolve(globalSettings);
    }
    let result = documentSettings.get(resource);
    if (!result) {
        result = connection.workspace.getConfiguration({
            scopeUri: resource,
            section: 'languageServerExample'
        });
        documentSettings.set(resource, result);
    }
    return result;
}
// Only keep settings for open documents
documents.onDidClose(e => {
    console.log('server onDidClose');
    documentSettings.delete(e.document.uri);
});
// The content of a text document has changed. This event is emitted
// when the text document first opened or when its content has changed.
documents.onDidChangeContent(change => {
    console.log('server onDidChangeContent');
    validateTextDocument(change.document);
});
async function validateTextDocument(textDocument) {
    // In this simple example we get the settings for every validate run.
    let settings = await getDocumentSettings(textDocument.uri);
    // The validator creates diagnostics for all uppercase words length 2 and more
    let text = textDocument.getText();
    let pattern = /\b[A-Z]{2,}\b/g;
    let m;
    let problems = 0;
    let diagnostics = [];
    while ((m = pattern.exec(text)) && problems < settings.maxNumberOfProblems) {
        problems++;
        let diagnostic = {
            severity: node_1.DiagnosticSeverity.Warning,
            range: {
                start: textDocument.positionAt(m.index),
                end: textDocument.positionAt(m.index + m[0].length)
            },
            message: `${m[0]} is all uppercase.`,
            source: 'ex'
        };
        if (hasDiagnosticRelatedInformationCapability) {
            diagnostic.relatedInformation = [
                {
                    location: {
                        uri: textDocument.uri,
                        range: Object.assign({}, diagnostic.range)
                    },
                    message: 'Spelling matters'
                },
                {
                    location: {
                        uri: textDocument.uri,
                        range: Object.assign({}, diagnostic.range)
                    },
                    message: 'Particularly for names'
                }
            ];
        }
        diagnostics.push(diagnostic);
    }
    // Send the computed diagnostics to VSCode.
    connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
}
connection.onDidChangeWatchedFiles(_change => {
    console.log('server onDidChangeWatchedFiles');
    // Monitored files have change in VSCode
    connection.console.log('We received an file change event');
});
// This handler provides the initial list of the completion items.
connection.onCompletion((_textDocumentPosition) => {
    console.log('server onDidChangeWatchedFiles');
    console.log(_textDocumentPosition);
    // The pass parameter contains the position of the text document in
    // which code complete got requested. For the example we ignore this
    // info and always provide the same completion items.
    return [
        {
            label: 'TypeScript',
            kind: node_1.CompletionItemKind.Text,
            data: 1
        },
        {
            label: 'JavaScript',
            kind: node_1.CompletionItemKind.Text,
            data: 2
        }
    ];
});
// This handler resolves additional information for the item selected in
// the completion list.
connection.onCompletionResolve((item) => {
    console.log('server onCompletionResolve');
    if (item.data === 1) {
        item.detail = 'TypeScript details';
        item.documentation = 'TypeScript documentation';
    }
    else if (item.data === 2) {
        item.detail = 'JavaScript details';
        item.documentation = 'JavaScript documentation';
    }
    return item;
});
// ---------------------------------------------------------------------------------------------------
// Add hover example
connection.onHover(params => {
    return {
        contents: {
            kind: vscode_languageserver_types_1.MarkupKind.Markdown,
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
// ---------------------------------------------------------------------------------------------------
function analyzeAST(document) {
    const analyzerTree = new out_1.Analyzer(document.getText(), document.uri);
    return analyzerTree;
}
// ---------------------------------------------------------------------------------------------------
// Add rename example
function _findDocumentHighlights(node, list) {
    if (node.nameLoc) {
        list.push({
            kind: vscode_languageserver_types_1.DocumentHighlightKind.Write,
            range: vscode_languageserver_types_1.Range.create(vscode_languageserver_types_1.Position.create(node.nameLoc.start.line, node.nameLoc.start.column), vscode_languageserver_types_1.Position.create(node.nameLoc.end.line, node.nameLoc.end.column))
        });
    }
    for (const child of node.children) {
        _findDocumentHighlights(child, list);
    }
}
function findDocumentHighlights(document, position) {
    const result = [];
    analyzeAST(document);
    const node = finder_1.Finder.findNodeByPosition({
        line: position.line,
        column: position.character
    });
    if (node) {
        _findDocumentHighlights(node, result);
    }
    return result;
}
function doRename(document, position, newName) {
    const highlights = findDocumentHighlights(document, position);
    const edits = highlights.map(h => vscode_languageserver_types_1.TextEdit.replace(h.range, newName));
    return {
        changes: { [document.uri]: edits }
    };
}
connection.onRenameRequest((params) => {
    console.log('onRenameRequest', params);
    const document = documents.get(params.textDocument.uri);
    if (document) {
        return doRename(document, params.position, params.newName);
    }
    return null;
});
// ---------------------------------------------------------------------------------------------------
// // ---------------------------------------------------------------------------------------------------
// // Go to definition
// function findTypeDefinition(document: TextDocument, position: Position): Definition {
// 	const analyze = analyzeAST(document);
// 	console.log("Position", position);
// 	const node = analyze.findParentByPositionEnd(<CustomPosition>{
// 		line: position.line,
// 		column: position.character
// 	});
// 	if (node && (node.type === 'UserDefinedTypeName' || node.type === 'StructDefinition')) {
// 		return {
// 			uri: node.uri,
// 			range: Range.create(
// 				Position.create(node.loc.start.line, node.loc.start.column),
// 				Position.create(node.loc.end.line, node.loc.end.column),
// 			)
// 		};
// 	}
// 	return [];
// }
// connection.onTypeDefinition((params) => {
// 	console.log('onTypeDefinition', params);
// 	const document = documents.get(params.textDocument.uri);
// 	if (document) {
// 		return findTypeDefinition(document, params.position);
// 	}
// });
// // ---------------------------------------------------------------------------------------------------
// // ---------------------------------------------------------------------------------------------------
// // Go to definition
// function findDefinition(document: TextDocument, position: Position): Definition {
// 	const analyze = analyzeAST(document);
// 	console.log("Position", position);
// 	const node = analyze.findParentByPositionEnd(<CustomPosition>{
// 		line: position.line,
// 		column: position.character
// 	});
// 	console.log("Naso sam node", node);
// 	if (node) {
// 		return {
// 			uri: node.uri,
// 			range: Range.create(
// 				Position.create(node.loc.start.line, node.loc.start.column),
// 				Position.create(node.loc.end.line, node.loc.end.column),
// 			)
// 		};
// 	}
// 	return [];
// }
// connection.onDefinition((params) => {
// 	console.log('onDefinition', params);
// 	const document = documents.get(params.textDocument.uri);
// 	if (document) {
// 		new Analyzer(document.getText(), params.textDocument.uri);
// 		return findDefinition(document, params.position);
// 	}
// });
// // ---------------------------------------------------------------------------------------------------
// // ---------------------------------------------------------------------------------------------------
// // Go to implementation
// connection.onImplementation((params) => {
// 	console.log('onImplementation');
// 	return [
// 		{
// 			uri: params.textDocument.uri,
// 			range: Range.create(
// 				Position.create(2, 2),
// 				Position.create(3, 3),
// 			)
// 		},
// 		{
// 			uri: params.textDocument.uri,
// 			range: Range.create(
// 				Position.create(10, 1),
// 				Position.create(10, 5),
// 			)
// 		}
// 	];
// });
// // ---------------------------------------------------------------------------------------------------
// // ---------------------------------------------------------------------------------------------------
// // Find all references
// function _findReferencesDocumentHighlights (node: Node, list: Node[]) {
// 	list.push(node);
// 	for (const child of node.children) {
// 		_findReferencesDocumentHighlights(child, list);
// 	}
// }
// function findReferencesDocumentHighlights (document: TextDocument, position: Position): Node[] {
// 	const result: Node[] = [];
// 	const analyze = analyzeAST(document);
// 	const node = analyze.findParentByPositionEnd(<CustomPosition>{
// 		line: position.line,
// 		column: position.character
// 	});
// 	if (node) {
// 		_findReferencesDocumentHighlights(node, result);
// 	}
// 	return result;
// }
// function onReferences(document: TextDocument, position: Position): any {
// 	const highlights = findReferencesDocumentHighlights(document, position);
// 	const references = highlights.map(h => {
// 		return {
// 			uri: h.uri,
// 			range: Range.create(
// 				Position.create(h.loc.start.line, h.loc.start.column),
// 				Position.create(h.loc.end.line, h.loc.end.column),
// 			)
// 		};
// 	});
// 	return references;
// }
// connection.onReferences((params) => {
// 	console.log('onReferences');
// 	const document = documents.get(params.textDocument.uri);
// 	if (document) {
// 		return onReferences(document, params.position);
// 	}
// });
// // ---------------------------------------------------------------------------------------------------
// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);
// Listen on the connection
connection.listen();
//# sourceMappingURL=server.js.map