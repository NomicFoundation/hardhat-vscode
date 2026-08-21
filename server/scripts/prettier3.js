const { spawnSync } = require("child_process");
const path = require("path");

try {
  // Get extra flags e.g. --check, --write
  const prettierFlags = process.argv.slice(2);

  // Find prettier3 (aliased) package path
  const packageRoot = path.dirname(require.resolve("prettier3/package.json"));

  console.log(`Found prettier at ${packageRoot}`);

  const binaryPath = path.join(packageRoot, "bin", "prettier.cjs");

  const spawnArgs = [
    binaryPath,
    ...prettierFlags,
    "*.json",
    "src/**/*.{ts,js,md,json,yml}",
    "test/**/*.{ts,js,md,json,yml}",
  ];

  // Execute the prettier3 binary, and exit with its status so that a
  // failing `--check` fails the lint run
  const { error, status } = spawnSync("node", spawnArgs, {
    stdio: "inherit",
  });

  if (error) {
    throw error;
  }

  process.exit(status === null ? 1 : status);
} catch (error) {
  console.error("Error running prettier:", error.message);
  process.exit(1);
}
