import path from "node:path";
import { ROOT_DIR } from "./paths.ts";

/**
 * Baked into both bundles by esbuild's `define`, which is why a bundle built
 * without them would silently ship empty strings rather than fail.
 */
const REQUIRED_VARIABLES = [
  "SOLIDITY_GA_SECRET",
  "SOLIDITY_GOOGLE_TRACKING_ID",
  "SOLIDITY_SENTRY_DSN",
];

const ROOT_DIR_ENV_PATH = path.join(ROOT_DIR, ".env");

/**
 * Load the repository's `.env`, if there is one.
 *
 * A missing file is the CI case — the release workflow passes these variables
 * in the environment directly and never writes an `.env` — so it is not an
 * error. Anything else is: `process.loadEnvFile` throws where `dotenv.config`,
 * which this replaced, returned quietly. Variables already in the environment
 * win over the file, as they did under `dotenv`.
 */
export function loadEnvFile(envFilePath = ROOT_DIR_ENV_PATH): void {
  try {
    process.loadEnvFile(envFilePath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }
  }
}

/** The esbuild `define` map holding the build-time secrets. */
export function definedConstants(): Record<string, string> {
  const defined: Record<string, string> = {};

  for (const key of REQUIRED_VARIABLES) {
    const value = process.env[key];

    if (value === undefined || value === "") {
      throw new Error(
        `\n\n'${key}' not set, have you added an '.env' file based on 'env.example'?\n\n`
      );
    }

    defined[`process.env.${key}`] = `"${value}"`;
    console.log(`Read 'process.env.${key}' from '.env' file.`);
  }

  return defined;
}
