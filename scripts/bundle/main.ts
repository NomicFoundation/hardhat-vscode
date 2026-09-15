import { parseArgs } from "node:util";
import { bundleClient } from "./subcommands/client.ts";
import { bundleServer } from "./subcommands/server.ts";

const USAGE = `Usage: node scripts/bundle/main.ts <target>

Bundle one of the two things this repository ships, with esbuild:
  client     Assemble client/tmp, the directory 'vsce package' is run from.
             Bundles the extension and its own copy of the language server,
             and installs the native server dependencies that cannot be
             bundled. Run by 'pnpm --filter ./client run package'.
  server     Bundle the language server into server/out, which is what the
             '@nomicfoundation/solidity-language-server' package publishes.
             Run by 'pnpm --filter ./server run bundle'.
`;

async function main(argv: string[]): Promise<void> {
  const { positionals } = parseArgs({ args: argv, allowPositionals: true });

  const [target, ...rest] = positionals;

  if (target === undefined || rest.length > 0) {
    console.log(USAGE);

    process.exitCode = target === undefined ? 0 : 1;

    return;
  }

  switch (target) {
    case "client":
      return bundleClient();
    case "server":
      return bundleServer();
    default:
      console.log(`Unknown target: ${target}\n`);
      console.log(USAGE);

      process.exitCode = 1;
  }
}

try {
  await main(process.argv.slice(2));
} catch (error) {
  console.error(error instanceof Error ? error.message : error);

  process.exitCode = 1;
}
