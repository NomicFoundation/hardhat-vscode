'use strict';

import * as fs from 'fs';
import * as path from 'path';

import { getClient } from '../../client';
import { IntegrationSamples } from '../../common/types';

suite('Navigation integration', async () => {
	const client = await getClient();

	const integrationSamples: IntegrationSamples[] = JSON.parse(fs.readFileSync(path.join(__dirname, 'navigation.test.json'), 'utf8'));

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
