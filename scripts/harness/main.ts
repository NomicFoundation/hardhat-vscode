import { parseArgs } from "node:util";
import { init } from "./subcommands/init.ts";

const USAGE = `Usage: node scripts/harness/main.ts <command> [options]

Drive the language server against the example workspaces in
example-workspaces/.

Commands:
  init       Install each workspace's dependencies and build it once, so the
             compilers it needs are downloaded. Safe to run again.

Options:
  --workspace <name>   Act on one workspace: hardhat3, foundry or hardhat2.
                       init sets up all of them without it.
`;

async function main(argv: string[]): Promise<void> {
  const { positionals, values } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      workspace: { type: "string" },
    },
  });

  const [command, ...rest] = positionals;

  if (command === undefined || rest.length > 0) {
    console.log(USAGE);

    process.exitCode = command === undefined ? 0 : 1;

    return;
  }

  switch (command) {
    case "init":
      return init(values.workspace);
    default:
      console.log(`Unknown command: ${command}\n`);
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
