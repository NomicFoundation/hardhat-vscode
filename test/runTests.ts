import * as path from 'path';
import { runTests } from 'vscode-test';

(async () => {
	try {
		// The folder containing the Extension Manifest package.json
		// Passed to `--extensionDevelopmentPath`
		const extensionDevelopmentPath = path.resolve(__dirname, '../../');

		// The path to test runner
		// Passed to --extensionTestsPath
		const extensionTestsPath = path.resolve(__dirname, './integration/index');

		// Download VS Code, unzip it and run the integration test
		await runTests({
			version: '1.59.0',
			extensionDevelopmentPath,
			extensionTestsPath
		});
	} catch (err) {
		console.error('Failed to run tests');
		process.exitCode = 1;
	}
})();
