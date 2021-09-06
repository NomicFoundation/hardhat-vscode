'use strict';

import * as assert from 'assert';

import { getClient } from '../../client';

suite('Configuration', async () => {
    const client = await getClient();
    const vscodeClient = client.getVSCodeClient();

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
