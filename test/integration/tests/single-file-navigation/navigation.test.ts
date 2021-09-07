'use strict';

import * as fs from 'fs';
import * as path from 'path';
import * as lsclient from 'vscode-languageclient/node';

import { getClient } from '../../client';
import { IntegrationSamples, Client } from '../../common/types';

suite('Navigation integration', () => {
	let client!: Client;
	let vscodeClient!: lsclient.LanguageClient;

	suiteSetup(async () => {
		client = await getClient();
		vscodeClient = client.getVSCodeClient();
	});

	const integrationSamples: IntegrationSamples[] = JSON.parse(fs.readFileSync(path.join(__dirname, 'navigation.test.json'), 'utf8'));
	for (const sample of integrationSamples) {
		test(sample.title, async () => {
			client.docUri = client.getDocUri(__dirname, sample.uri);
			await client.changeDocument(client.docUri);

			const fn = client.navigationProvider[`do${sample.action}`].bind(client.navigationProvider);
			if (!fn) {
				throw new Error("Action request not implemented!");
			}

			await fn(client.document, sample);
		});
	}
});
