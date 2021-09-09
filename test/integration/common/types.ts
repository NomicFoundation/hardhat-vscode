'use strict';

import * as vscode from 'vscode';
import * as lsclient from 'vscode-languageclient/node';

export type Position = {
	/**
	 * The zero-based line value.
	 */
	line: number,
	/**
	 * The zero-based character value.
	 */
	character: number
}

export type ActionParams = {
	/**
	 * Represents a line and character position, such as the position of the cursor.
	 */
	position?: Position | undefined,

	/**
	 * Optional param. Currently used only in RenameRequest.
	 */
	new_name?: string | undefined,
}

export type Action = {
	/**
	 * The name of the action to be executed.
	 */
	action: string,
	/**
	 * The path to the file for which we run the test.
	 * The path is specified in the relative path of the ./test/testdata/ directory.
	 */
	uri: string,

	/**
	 * Optonal action params
	 */
	params?: ActionParams | undefined;

	/**
	 * The expected result of the action.
	 */
	expected: any[]
}

export type IntegrationSamples = {
	/**
	 * Test title.
	 */
	title: string,

	/**
	 * List of related actions
	 */
	actions: Action[]
}

export type IndexFileData = {
	path: string,
	current: number,
	total: number,
};


export interface NavigationProvider {
	client: lsclient.LanguageClient;
    tokenSource: vscode.CancellationTokenSource;

    doDefinitionRequest(document: vscode.TextDocument, action: Action): Promise<void>;
    doTypeDefinitionRequest(document: vscode.TextDocument, action: Action): Promise<void>;
    doReferencesRequest(document: vscode.TextDocument, action: Action): Promise<void>;
    doImplementationRequest(document: vscode.TextDocument, action: Action): Promise<void>;
    doRenameRequest(document: vscode.TextDocument, action: Action): Promise<void>;
}

export interface Client {
    document: vscode.TextDocument;
    docUri: vscode.Uri;

    navigationProvider: NavigationProvider;

    /**
     * Activates the tenderly.solidity-extension extension
     */
    activate(): Promise<void>;

    getDocPath(dirname: string, p: string): string;
    getDocUri(dirname: string, p: string): vscode.Uri;

    changeDocument(docUri: vscode.Uri): Promise<void>;

    getVSCodeClient(): lsclient.LanguageClient;
}
