import path from "path";
// eslint-disable-next-line import/no-extraneous-dependencies
import Mocha from "mocha";
// eslint-disable-next-line import/no-extraneous-dependencies
import glob from "glob";

export function run(): Promise<void> {
  // Create the mocha test
  const mocha = new Mocha({
    ui: "tdd",
    color: true,
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
