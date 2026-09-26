import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, it } from "node:test";
import { definedConstants, loadEnvFile } from "./env.ts";

const VARIABLES = [
  "SOLIDITY_GA_SECRET",
  "SOLIDITY_GOOGLE_TRACKING_ID",
  "SOLIDITY_SENTRY_DSN",
];

function withVariables(values: Record<string, string | undefined>): void {
  for (const [key, value] of Object.entries(values)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
}

describe("loadEnvFile", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "bundle-env-"));

  afterEach(() => {
    delete process.env.FROM_ENV_FILE;
  });

  it("reads the file when there is one", () => {
    const envFilePath = path.join(tmpDir, "present.env");
    fs.writeFileSync(envFilePath, "FROM_ENV_FILE=yes\n");

    loadEnvFile(envFilePath);

    assert.equal(process.env.FROM_ENV_FILE, "yes");
  });

  // The release workflow passes the variables in the environment and never
  // writes an `.env`, so this is the CI path. `dotenv`, which this replaced,
  // returned quietly here; `process.loadEnvFile` throws.
  it("tolerates a missing file", () => {
    assert.doesNotThrow(() => loadEnvFile(path.join(tmpDir, "absent.env")));
  });

  it("does not swallow a failure that is not a missing file", () => {
    assert.throws(() => loadEnvFile(tmpDir));
  });
});

describe("definedConstants", () => {
  const original = Object.fromEntries(
    VARIABLES.map((key) => [key, process.env[key]])
  );

  afterEach(() => withVariables(original));

  it("quotes each value for esbuild's define", () => {
    withVariables({
      SOLIDITY_GA_SECRET: "secret",
      SOLIDITY_GOOGLE_TRACKING_ID: "tracking",
      SOLIDITY_SENTRY_DSN: "dsn",
    });

    assert.deepEqual(definedConstants(), {
      "process.env.SOLIDITY_GA_SECRET": '"secret"',
      "process.env.SOLIDITY_GOOGLE_TRACKING_ID": '"tracking"',
      "process.env.SOLIDITY_SENTRY_DSN": '"dsn"',
    });
  });

  it("refuses to bake in an empty value", () => {
    withVariables({
      SOLIDITY_GA_SECRET: "secret",
      SOLIDITY_GOOGLE_TRACKING_ID: "tracking",
      SOLIDITY_SENTRY_DSN: "",
    });

    assert.throws(definedConstants, /SOLIDITY_SENTRY_DSN' not set/);
  });

  it("refuses to bake in a missing value", () => {
    withVariables({
      SOLIDITY_GA_SECRET: "secret",
      SOLIDITY_GOOGLE_TRACKING_ID: undefined,
      SOLIDITY_SENTRY_DSN: "dsn",
    });

    assert.throws(definedConstants, /SOLIDITY_GOOGLE_TRACKING_ID' not set/);
  });
});
