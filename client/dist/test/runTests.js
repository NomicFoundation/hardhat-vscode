"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const vscode_test_1 = require("vscode-test");
(async () => {
    try {
        // The folder containing the Extension Manifest package.json
        // Passed to `--extensionDevelopmentPath`
        const extensionDevelopmentPath = path.resolve(__dirname, '../../../');
        // The path to test runner
        // Passed to --extensionTestsPath
        const extensionTestsPath = path.resolve(__dirname, './index');
        // Download VS Code, unzip it and run the integration test
        await vscode_test_1.runTests({
            version: '1.55.0',
            extensionDevelopmentPath,
            extensionTestsPath
        });
    }
    catch (err) {
        console.error('Failed to run tests');
        process.exitCode = 1;
    }
})();
//# sourceMappingURL=runTests.js.map