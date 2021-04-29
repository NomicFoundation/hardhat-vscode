import * as path from 'path';

import { runTests } from 'vscode-test';

(async () => {
	try {
		/**
		 * Basic usage
		 */
		await runTests({
			version: '1.55.0',
			extensionDevelopmentPath: path.resolve(__dirname, '..'),
			extensionTestsPath: __dirname
		});
	} catch (err) {
		console.error('Failed to run tests');
		process.exitCode = 1;
	}
})();
