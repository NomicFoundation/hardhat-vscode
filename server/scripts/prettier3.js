const { execSync } = require("child_process");
const path = require("path");

try {
  // Get extra flags e.g. --check, --write
  const prettierFlags = process.argv.slice(2);

  // Find prettier3 (aliased) package path
  const lsOutput = execSync("npm ls prettier3 --parseable").toString().trim();
  const packageRoot = lsOutput.split("\n")[0];

  console.log(`Found prettier at ${packageRoot}`);

  const binaryPath = path.join(packageRoot, "bin", "prettier.cjs");

  const spawnArgs = [
    binaryPath,
    ...prettierFlags,
    "*.json",
    "src/**/*.{ts,js,md,json,yml}",
    "test/**/*.{ts,js,md,json,yml}",
  ];

  // Execute the prettier3 binary
  require("child_process").spawn("node", spawnArgs, {
    stdio: "inherit",
  });
} catch (error) {
  console.error("Error running prettier:", error.message);
  process.exit(1);
}
