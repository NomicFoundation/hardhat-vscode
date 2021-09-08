'use strict';

import * as fs from 'fs';
import * as path from 'path';
import * as assert from 'assert';
import * as lsclient from 'vscode-languageclient/node';

import { getClient } from '../../client';
import { Client } from '../../common/types';

suite('Configuration', () => {
    let client!: Client;
    let vscodeClient!: lsclient.LanguageClient;

	suiteSetup((done) => {
		getClient().then(c => {
			client = c;
			vscodeClient = c.getVSCodeClient();

			done();
		});
	});

	test('InitializeResult', () => {
		const expected = JSON.parse(fs.readFileSync(path.join(__dirname, 'configuration.test.json'), 'utf8'));
		assert.deepStrictEqual(vscodeClient.initializeResult, expected);
	});
});
