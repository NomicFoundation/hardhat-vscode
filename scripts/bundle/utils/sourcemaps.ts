import { spawnSync } from "node:child_process";
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import vm from "node:vm";

const require = createRequire(import.meta.url);

// `@sentry/cli` is CommonJS and Node will not pick a named export out of it
// from an `import`, so it is reached through `createRequire`.
const { SentryCli } = require("@sentry/cli") as {
  SentryCli: { getPath: () => string };
};

const SOURCE_MAPPING_URL_COMMENT = "//# sourceMappingURL=";

// DELETE: smoke test - normally "vscode-extension".
const SENTRY_ORG = "nomic-labs";
const SENTRY_PROJECT = "vscode-extension-testing";

function sentryCli(args: string[]): void {
  console.log(`$ sentry-cli ${args.join(" ")}`);

  const { status, error } = spawnSync(SentryCli.getPath(), args, {
    stdio: "inherit",
  });

  if (error !== undefined) {
    throw error;
  }

  if (status !== 0) {
    throw new Error(`sentry-cli exited with ${status}`);
  }
}

/**
 * Stamp every bundle and its sourcemap with a debug id, which is what lets
 * Sentry match a stack frame to a sourcemap.
 *
 * Debug ids are matched on content, not on a path or a release, so this has to
 * happen before the bundles are packaged and it does not matter where the
 * extension is installed or which version it reports.
 */
export function injectDebugIds(dir: string): void {
  sentryCli(["sourcemaps", "inject", dir]);
}

/**
 * Upload the sourcemaps, if there is a token to do it with.
 *
 * Only the release workflow has one, so a local build injects debug ids and
 * uploads nothing - the vsix is identical either way. The token is the only
 * thing that has to come from the environment; the organisation and project
 * are named here.
 *
 * Note that esbuild emits `sourcesContent`, so this uploads our TypeScript
 * source to our own Sentry project. That is deliberate: without it the issue
 * view has line numbers but no code.
 */
export function uploadSourcemaps(dir: string): void {
  if (
    process.env.SENTRY_AUTH_TOKEN === undefined ||
    process.env.SENTRY_AUTH_TOKEN === ""
  ) {
    console.log("> SENTRY_AUTH_TOKEN not set, skipping the sourcemap upload.");

    return;
  }

  sentryCli([
    "sourcemaps",
    "upload",
    "--org",
    SENTRY_ORG,
    "--project",
    SENTRY_PROJECT,
    dir,
  ]);
}

/**
 * Drop the sourcemaps, and the comments pointing at them, from the packaged
 * extension.
 *
 * No `.vscodeignore` is copied into `tmp`, so anything left here ships. The
 * debug id snippet that `inject` wrote into each bundle stays - that is the
 * half Sentry needs at runtime - and only the maps themselves go.
 */
export function removeSourcemaps(dir: string): void {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const entryPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      removeSourcemaps(entryPath);
    } else if (entry.name.endsWith(".js.map")) {
      fs.unlinkSync(entryPath);
    } else if (entry.name.endsWith(".js")) {
      const contents = fs.readFileSync(entryPath, "utf8");
      const stripped = stripSourceMappingUrls(contents);

      if (stripped !== contents) {
        fs.writeFileSync(entryPath, stripped);
      }

      assertParses(entryPath, stripped);
    }
  }
}

/**
 * Drop whole lines that are the sourcemap comment, and only those.
 *
 * Line by line rather than by pattern: the bundles carry the TypeScript
 * compiler, whose own source builds that comment in a string and in a template
 * literal. A pattern loose enough to find the comment also finds those, and
 * takes the closing quote with it.
 */
function stripSourceMappingUrls(contents: string): string {
  return contents
    .split("\n")
    .filter((line) => !line.startsWith(SOURCE_MAPPING_URL_COMMENT))
    .join("\n");
}

/**
 * Refuse to ship a bundle that will not parse.
 *
 * Nothing else in the build runs this code - the tests exercise the TypeScript
 * sources, not the bundle - so without this a corrupted bundle reaches a user's
 * editor before anyone finds out. `vm.Script` compiles without executing.
 */
function assertParses(file: string, contents: string): void {
  try {
    // eslint-disable-next-line no-new
    new vm.Script(contents, { filename: file });
  } catch (error) {
    throw new Error(
      `${file} is not parseable after processing: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}
