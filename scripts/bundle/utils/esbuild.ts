import esbuild from "esbuild";
import type { BuildOptions } from "esbuild";
import { createRequire } from "node:module";
import { SERVER_DIR } from "./paths.ts";

const require = createRequire(import.meta.url);

/**
 * `module-alias` is a dependency of the server, so it is resolved out of the
 * server's tree — pnpm does not hoist it to the root, and `import.meta.resolve`
 * has no `paths` equivalent.
 */
const MODULE_ALIAS_CJS = require.resolve("module-alias", {
  paths: [SERVER_DIR],
});

const EXTERNAL = [
  // Provided by the extension host. Only the client bundle imports it; the
  // server has no reference to resolve, so listing it here is inert there.
  "vscode",
  "@nomicfoundation/solidity-analyzer",
  "@nomicfoundation/slang",
  "fsevents",
  "mocha",
  // ts-node reaches its optional swc transpiler through
  // `require.resolve`, which esbuild cannot rewrite. The path is only
  // taken by a project that sets `swc` in its ts-node options, and it
  // would not resolve inside the bundle either way, so mark it external -
  // esbuild's own suggestion - rather than let it warn on every build.
  "./transpilers/swc.js",
];

interface CommonOptions {
  /** The package directory every path in the build is relative to. */
  absWorkingDir: string;
  /** The build-time secrets, from `definedConstants`. */
  buildTimeSecrets: Record<string, string>;
}

/** The esbuild options the client and server bundles have in common. */
export function commonOptions({
  absWorkingDir,
  buildTimeSecrets,
}: CommonOptions): BuildOptions {
  return {
    absWorkingDir,
    bundle: true,
    minifyWhitespace: false,
    minifyIdentifiers: false,
    minifySyntax: false,
    alias: {
      "module-alias": MODULE_ALIAS_CJS,
    },
    external: EXTERNAL,
    platform: "node",
    outdir: ".",
    logLevel: "info",
    target: "node20",
    format: "cjs",
    define: buildTimeSecrets,
  };
}

/**
 * Build, and treat a warning as fatal. esbuild warns about things that are
 * silently wrong in a bundle rather than broken at build time — an import that
 * will always be undefined, say — so none of them are acceptable here.
 */
export async function build(options: BuildOptions): Promise<void> {
  const { warnings, errors } = await esbuild.build(options);

  if (warnings.length > 0 || errors.length > 0) {
    console.error("Warning/Errors found");

    for (const message of warnings.concat(errors)) {
      console.error(message);
    }

    process.exit(1);
  }
}
