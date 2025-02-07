import * as path from "path";
import { runTests } from "@vscode/test-electron";

(async () => {
  try {
    // The folder containing the Extension Manifest package.json
    // Passed to `--extensionDevelopmentPath`
    const extensionDevelopmentPath = path.resolve(
      __dirname,
      "..",
      "..",
      "client"
    );

    // The path to test runner
    // Passed to --extensionTestsPath
    const extensionTestsPath = path.resolve(__dirname, "e2e", "index");

    const folder = path.resolve(__dirname, "..", "..", "test", "e2e");

    // Download VS Code, unzip it and run the e2e test
    await runTests({
      version: "1.86.0",
      extensionDevelopmentPath,
      extensionTestsPath,

      launchArgs: [
        folder,
        "--disable-extensions",
        // https://github.com/microsoft/vscode/issues/115794#issuecomment-774283222
        "--force-disable-user-env",
      ],
      extensionTestsEnv: {
        VSCODE_NODE_ENV: "development",
      },
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Failed to run tests, err:", err);
    process.exitCode = 1;
  }
})();
