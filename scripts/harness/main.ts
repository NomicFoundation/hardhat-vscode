import { parseArgs } from "node:util";
import { init } from "./subcommands/init.ts";
import { reset } from "./subcommands/reset.ts";
import { validate } from "./subcommands/validate.ts";

const USAGE = `Usage: node scripts/harness/main.ts <command> [options]

Drive the language server against the example workspaces in
example-workspaces/.

Commands:
  init       Install each workspace's dependencies and build it once, so the
             compilers it needs are downloaded. Safe to run again.
  validate   Build the current workspace and run its tests.
  reset      Put a workspace back to the commit checked out, discarding
             edits. Gitignored files, such as installs, are kept. Refused
             while a daemon is running.

The current workspace is the one recorded in .harness/workspace.

Options:
  --workspace <name>   The workspace to act on: hardhat3, foundry or hardhat2.
                       init sets up all of them without it. reset falls back
                       to the current workspace, and fails without either.
                       validate always acts on the current workspace.
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
    case "validate":
      rejectWorkspaceOption(command, values.workspace);

      return validate();
    case "reset":
      return reset(values.workspace);
    default:
      console.log(`Unknown command: ${command}\n`);
      console.log(USAGE);

      process.exitCode = 1;
  }
}

function rejectWorkspaceOption(
  command: string,
  workspace: string | undefined
): void {
  if (workspace !== undefined) {
    throw new Error(
      `${command} acts on the current workspace and takes no --workspace`
    );
  }
}

try {
  await main(process.argv.slice(2));
} catch (error) {
  console.error(error instanceof Error ? error.message : error);

  process.exitCode = 1;
}
