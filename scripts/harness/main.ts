import { parseArgs } from "node:util";
import { init } from "./subcommands/init.ts";
import { lspMessage } from "./subcommands/lsp-message.ts";
import { reset } from "./subcommands/reset.ts";
import { start } from "./subcommands/start.ts";
import { status } from "./subcommands/status.ts";
import { stop } from "./subcommands/stop.ts";
import { validate } from "./subcommands/validate.ts";

const USAGE = `Usage: node scripts/harness/main.ts <command> [options]

Drive the language server against the example workspaces in
example-workspaces/.

Commands:
  init       Install each workspace's dependencies and build it once, so the
             compilers it needs are downloaded. Safe to run again.
  start      Start a daemon holding a language server against a workspace,
             replacing any daemon already running, and make it the current
             workspace. Runs in the foreground until Ctrl+C, or detaches with
             --background once the workspace is fully initialized.
  stop       Stop the daemon, which shuts its language server down.
  status     Report the daemon and the current workspace. Exits 0 only when
             a daemon is running and ready.
  lsp-message
             Send to the running daemon's language server, and print the
             answer as JSON. Exits 1 if the server answers with an error.
               --message <json>    One JSON-RPC message, passed through as
                                   given: a request if it has an "id", else
                                   a notification.
               --sync-from-disk --file <path> [--file <path>...]
                                   Bring the server's copy of each file up to
                                   date with the disk. Sends only didOpen, or
                                   a full-text didChange, and nothing else.
                                   Paths are relative to the workspace.
  validate   Build the current workspace and run its tests.
  reset      Put a workspace back to the commit checked out, discarding
             edits. Gitignored files, such as installs, are kept. Refused
             while a daemon is running.

The current workspace is the one recorded in .harness/workspace. All state
lives in .harness/ (gitignored); --background logs to .harness/daemon.log.

Options:
  --workspace <name>   The workspace to act on: hardhat3, foundry or hardhat2.
                       start requires it. init sets up all of them without
                       it. reset falls back to the current workspace, and
                       fails without either. validate always acts on the
                       current workspace.
  --background         With start: detach, and return once it is ready.

Examples:
  pnpm harness start --workspace hardhat3              # foreground; Ctrl+C to stop
  pnpm harness start --workspace hardhat3 --background
  pnpm harness status
  pnpm harness lsp-message --sync-from-disk --file contracts/Greeter.sol
  pnpm harness lsp-message --message '{"id": 1, "method": "textDocument/documentSymbol",
    "params": {"textDocument": {"uri": "file:///.../contracts/Greeter.sol"}}}'
  pnpm harness stop
`;

async function main(argv: string[]): Promise<void> {
  const { positionals, values } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      workspace: { type: "string" },
      background: { type: "boolean", default: false },
      message: { type: "string" },
      "sync-from-disk": { type: "boolean", default: false },
      file: { type: "string", multiple: true, default: [] },
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
    case "start":
      return start(values.workspace, values.background);
    case "stop":
      rejectWorkspaceOption(command, values.workspace);

      return stop();
    case "status":
      rejectWorkspaceOption(command, values.workspace);

      return status();
    case "lsp-message":
      rejectWorkspaceOption(command, values.workspace);

      return lspMessage({
        message: values.message,
        syncFromDisk: values["sync-from-disk"],
        files: values.file,
      });
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
