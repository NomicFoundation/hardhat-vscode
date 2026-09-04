/* eslint-disable @typescript-eslint/no-non-null-assertion */
import assert from "assert";
import { spawnSync } from "child_process";
import * as path from "path";
import * as vscode from "vscode";
import { getTestContractUri } from "../../helpers/getTestContract";
import { openFileInEditor, waitForUI } from "../../helpers/editor";

const FLATTEN_COMMAND = "solidity.hardhat.flattenCurrentFile";
const OPEN_TIMEOUT = 20_000;

suite("commands - flatten", function () {
  // The probe below needs longer than mocha's default, so that a hang reports
  // what it found rather than being killed at 30s with nothing to say.
  this.timeout(120_000);

  // `index.ts` sets `retries: 5` for every test. Mocha prints only the last
  // attempt's error, so retrying here would run the probe six times and show
  // one report — and the failure it is chasing repeats on every attempt anyway.
  this.retries(0);

  test("flatten via command palette", async () => {
    const uri = getTestContractUri("main/contracts/commands/Importer.sol");
    await openFileInEditor(uri);

    await vscode.commands.executeCommand(
      "workbench.action.quickOpen",
      ">Hardhat: Flatten"
    );
    await waitForUI();

    await vscode.commands.executeCommand(
      "workbench.action.acceptSelectedQuickOpenItem"
    );

    // Wait for new tab to be opened, then a bit extra for the contract text to
    // be populated.
    if (!(await documentOpens(OPEN_TIMEOUT))) {
      assert.fail(await diagnose(uri));
    }

    await waitForUI();

    const editor = vscode.window.activeTextEditor!;
    assert.ok(
      editor.document.getText().includes("Sources flattened with hardhat")
    );
  });
});

/** Resolves true when a document opens, false if none does in time. */
async function documentOpens(timeout: number): Promise<boolean> {
  return new Promise((resolve) => {
    const subscription = vscode.workspace.onDidOpenTextDocument(() => {
      clearTimeout(timer);
      subscription.dispose();
      resolve(true);
    });

    const timer = setTimeout(() => {
      subscription.dispose();
      resolve(false);
    }, timeout);
  });
}

/**
 * Why no document opened. The command hangs identically whether the palette
 * picked the wrong entry or `hardhat flatten` produced nothing —
 * `FlattenCurrentFileCommand.onClose` returns without opening a document when
 * stdout is empty — so this separates the two, in one CI run:
 *
 * - runs `hardhat flatten` the way the command does, and reports its exit
 *   status and output;
 * - invokes the command by id, skipping the palette, and says whether that
 *   opened a document.
 */
async function diagnose(uri: vscode.Uri): Promise<string> {
  const lines = ["flatten did not open a document.", ""];

  const projectDir = path.dirname(path.dirname(path.dirname(uri.fsPath)));
  lines.push(`Project: ${projectDir}`);
  lines.push(`Node: ${process.version} on ${process.platform}`);
  lines.push(
    `Command registered: ${(await vscode.commands.getCommands()).includes(
      FLATTEN_COMMAND
    )}`
  );
  lines.push("", "Open documents:");

  for (const document of vscode.workspace.textDocuments) {
    lines.push(`  ${document.languageId}  ${document.uri.toString()}`);
  }

  lines.push("", "Running hardhat flatten directly:");
  lines.push(indent(runFlatten(projectDir, uri.fsPath)));

  lines.push("", "Invoking the command by id, without the palette:");
  const byId = vscode.commands.executeCommand(FLATTEN_COMMAND);
  const openedById = await documentOpens(OPEN_TIMEOUT);
  await byId;
  lines.push(`  opened a document: ${openedById}`);

  return lines.join("\n");
}

function runFlatten(projectDir: string, file: string): string {
  let cliPath: string;

  try {
    cliPath = require.resolve("hardhat/internal/cli/cli", {
      paths: [projectDir],
    });
  } catch (resolveError) {
    return `could not resolve the hardhat CLI: ${resolveError}`;
  }

  const { status, stdout, stderr, error } = spawnSync(
    "node",
    [cliPath, "flatten", file],
    { cwd: projectDir, encoding: "utf8", timeout: 60_000 }
  );

  return [
    `cli: ${cliPath}`,
    `exit: ${status}${error === undefined ? "" : ` (${error.message})`}`,
    `stdout (${stdout?.length ?? 0} bytes): ${truncate(stdout)}`,
    `stderr (${stderr?.length ?? 0} bytes): ${truncate(stderr)}`,
  ].join("\n");
}

function truncate(text: string | null): string {
  if (text === null || text === "") {
    return "<empty>";
  }

  return text.length > 800 ? `${text.slice(0, 800)}…` : text;
}

function indent(text: string): string {
  return text
    .split("\n")
    .map((line) => `  ${line}`)
    .join("\n");
}
