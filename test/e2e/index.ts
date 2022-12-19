import path from "path";
// eslint-disable-next-line import/no-extraneous-dependencies
import Mocha from "mocha";
// eslint-disable-next-line import/no-extraneous-dependencies
import glob from "glob";
import vscode from "vscode";
import { sleep } from "./helpers/sleep";

export function run(): Promise<void> {
  // Create the mocha test
  const mocha = new Mocha({
    ui: "tdd",
    color: true,
    rootHooks: {
      beforeAll: async () => {
        // Wait until extension is fully initialized (index + analysis + validation ready)
        while (
          vscode.extensions
            .getExtension("nomicfoundation.hardhat-solidity")
            ?.exports.isReady() !== true
        ) {
          await sleep(100);
        }
        // await sleep(5000); // Wait for the extension to be loaded
      },
    },
    timeout: 30000,
    retries: 5,
  });

  const testsRoot = path.resolve(__dirname, "tests");

  return new Promise((resolve, reject) => {
    glob("**/*.test.js", { cwd: testsRoot }, (err, files) => {
      if (err) {
        return reject(err);
      }

      // Add files to the test suite
      files.forEach((f) => mocha.addFile(path.resolve(testsRoot, f)));

      try {
        // Run the mocha test
        mocha.run((failures) => {
          if (failures > 0) {
            reject(new Error(`${failures} tests failed.`));
          } else {
            resolve();
          }
        });
      } catch (innerErr) {
        // eslint-disable-next-line no-console
        console.error(innerErr);
        reject(innerErr);
      }
    });
  });
}
