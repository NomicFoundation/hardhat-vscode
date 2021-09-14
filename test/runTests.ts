import * as path from 'path';
import { runTests } from 'vscode-test';

(async () => {
	try {
		// The folder containing the Extension Manifest package.json
		// Passed to `--extensionDevelopmentPath`
		const extensionDevelopmentPath = path.resolve(__dirname, '..', '..');

		// The path to test runner
		// Passed to --extensionTestsPath
		const extensionTestsPath = path.resolve(__dirname, 'integration', 'index');

		// Download VS Code, unzip it and run the integration test
		await runTests({
			version: '1.59.0',
			extensionDevelopmentPath,
			extensionTestsPath,
			launchArgs: [
				'--disable-extensions',
				'--no-sandbox',
				// https://github.com/microsoft/vscode/issues/115794#issuecomment-774283222
				'--force-disable-user-env'
			]
		});
	} catch (err) {
		console.error('Failed to run tests, err: ', err);
		process.exitCode = 1;
	}
})();
