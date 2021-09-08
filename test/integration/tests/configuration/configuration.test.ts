'use strict';

import * as fs from 'fs';
import * as path from 'path';
import * as assert from 'assert';
import * as lsclient from 'vscode-languageclient/node';

import { getClient } from '../../client';
import { Client } from '../../common/types';

suite('Configuration', () => {
    // let client!: Client;
    // let vscodeClient!: lsclient.LanguageClient;

	// suiteSetup(async () => {
	// 	client = await getClient();
	// 	vscodeClient = client.getVSCodeClient();
	// });

	test('InitializeResult', async function() {
		const client = await getClient();
		const vscodeClient = client.getVSCodeClient();

		const expected = JSON.parse(fs.readFileSync(path.join(__dirname, 'configuration.test.json'), 'utf8'));
		assert.deepStrictEqual(vscodeClient.initializeResult, expected);
	});
});
