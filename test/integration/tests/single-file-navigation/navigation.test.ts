'use strict';

import * as fs from 'fs';
import * as path from 'path';
import * as lsclient from 'vscode-languageclient/node';

import { getClient, Client } from '../../client';
import { IntegrationSamples } from '../../common/types';

suite('Navigation integration', () => {
	let client!: Client;
	let vscodeClient!: lsclient.LanguageClient;

	let integrationSamples: IntegrationSamples[];

	suiteSetup(async () => {
		client = await getClient();
		vscodeClient = client.getVSCodeClient();

		integrationSamples = JSON.parse(fs.readFileSync(path.join(__dirname, 'navigation.test.json'), 'utf8'));
	});

	suiteTeardown(async () => {
		await vscodeClient.stop();
	});

	for (const sample of integrationSamples) {
		test(sample.title, async () => {
			client.docUri = client.getDocUri(__dirname, sample.uri);
			await client.changeDocument(client.docUri);

			const fn = client.navigationProvider[`do${sample.action}`];
			if (!fn) {
				throw new Error("Action request not implemented!");
			}

			await fn(client.document, sample);
		});
	}
});
