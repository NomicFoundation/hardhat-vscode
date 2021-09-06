'use strict';

import * as assert from 'assert';
import * as lsclient from 'vscode-languageclient/node';

import { getClient, Client } from '../../client';

suite('Configuration', async () => {
    let client!: Client;
    let vscodeClient!: lsclient.LanguageClient;

	suiteSetup(async () => {
		client = await getClient();
		vscodeClient = client.getVSCodeClient();
	});

	suiteTeardown(async () => {
		await vscodeClient.stop();
	});

	test('InitializeResult', () => {
        // TO-DO: Move this to JSON
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

		assert.deepStrictEqual(vscodeClient.initializeResult, expected);
	});
});
