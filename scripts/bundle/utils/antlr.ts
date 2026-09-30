import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { SERVER_DIR } from "./paths.ts";

const require = createRequire(import.meta.url);

/**
 * Resolve the parser package rather than pointing at a path in the root
 * `node_modules`: only npm's flat layout puts it there, and the parser is a
 * dependency of the server package, not of the client or of `scripts/`.
 */
const ANTLR_MODULE_PATH = path.join(
  path.dirname(
    require.resolve("@solidity-parser/parser/package.json", {
      paths: [SERVER_DIR],
    })
  ),
  "src",
  "antlr"
);

const TOKEN_FILES = ["Solidity.tokens", "SolidityLexer.tokens"];

/**
 * Copy across the two token files that solidity-parser pulls via readFile (is
 * there a way of doing this with the bundler?). Both the server and the client
 * bundle need them.
 */
export function copyAntlrTokens(destinationDir: string): void {
  for (const tokenFile of TOKEN_FILES) {
    fs.copyFileSync(
      path.join(ANTLR_MODULE_PATH, tokenFile),
      path.join(destinationDir, tokenFile)
    );
  }
}
