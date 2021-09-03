'use strict';

import * as assert from 'assert';
import * as vscode from 'vscode';
import * as lsclient from 'vscode-languageclient/node';

import {
    document, rangeEqual, uriEqual,
    isDefined, isInstanceOf, isArray
} from '../common/helper';
import { IntegrationSamples } from '../common/types';

export class NavigationProvider {
	client: lsclient.LanguageClient;
    tokenSource: vscode.CancellationTokenSource;

	constructor(client: lsclient.LanguageClient, tokenSource: vscode.CancellationTokenSource) {
		this.client = client;
        this.tokenSource = tokenSource;
	}

    async doDefinitionRequest(sample: IntegrationSamples): Promise<void> {
        const provider = this.client.getFeature(lsclient.DefinitionRequest.method).getProvider(document);
        isDefined(provider);

        const position = new vscode.Position(sample.position.line, sample.position.character);
        const result = (await provider.provideDefinition(document, position, this.tokenSource.token)) as vscode.Location;

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
    
    async doTypeDefinitionRequest(sample: IntegrationSamples): Promise<void> {
        const provider = this.client.getFeature(lsclient.TypeDefinitionRequest.method).getProvider(document);
        isDefined(provider);
    
        const position = new vscode.Position(sample.position.line, sample.position.character);
        const results = (await provider.provideTypeDefinition(document, position, this.tokenSource.token)) as vscode.Location[];
    
        isArray(results, sample.expected.length);
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
    
    async doReferencesRequest(sample: IntegrationSamples): Promise<void> {
        const provider = this.client.getFeature(lsclient.ReferencesRequest.method).getProvider(document);
        isDefined(provider);
    
        const position = new vscode.Position(sample.position.line, sample.position.character);
        const results = (await provider.provideReferences(
            document,
            position,
            {
                includeDeclaration: true
            },
            this.tokenSource.token
        )) as vscode.Location[];
        
        isArray(results, sample.expected.length);
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
    
    async doImplementationRequest(sample: IntegrationSamples): Promise<void> {
        const provider = this.client.getFeature(lsclient.ImplementationRequest.method).getProvider(document);
        isDefined(provider);
    
        const position = new vscode.Position(sample.position.line, sample.position.character);
        const results = (await provider.provideImplementation(
            document,
            position,
            this.tokenSource.token
        )) as vscode.Location[];
    
        isArray(results, sample.expected.length);
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
    
    async doRenameRequest(sample: IntegrationSamples): Promise<void> {
        const provider = this.client.getFeature(lsclient.RenameRequest.method).getProvider(document);
        isDefined(provider);
    
        const position = new vscode.Position(sample.position.line, sample.position.character);
        const renameResult = await provider.provideRenameEdits(document, position, sample.new_name, this.tokenSource.token);
    
        isArray(renameResult.entries(), sample.expected.length);
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
    
            isArray(textEdits, expected[1].length);
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
}
