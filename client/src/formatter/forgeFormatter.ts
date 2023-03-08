/* eslint-disable @typescript-eslint/strict-boolean-expressions */
/* eslint-disable @typescript-eslint/no-explicit-any */
import * as vscode from "vscode";
import * as cp from "child_process";
import path from "path";
import { runCmd, runningOnWindows } from "../utils/os";

let resolvedForgeCommand: string;

export async function formatDocument(
  document: vscode.TextDocument
): Promise<vscode.TextEdit[]> {
  const firstLine = document.lineAt(0);
  const lastLine = document.lineAt(document.lineCount - 1);
  const fullTextRange = new vscode.Range(
    firstLine.range.start,
    lastLine.range.end
  );

  const forgeCommand = await resolveForgeCommand();

  const formatted = await new Promise<string>((resolve, reject) => {
    const documentUri = vscode.window.activeTextEditor?.document.uri.fsPath;
    const rootPath = documentUri && path.dirname(documentUri);

    const forge = cp.execFile(
      forgeCommand,
      ["fmt", "--raw", "-"],
      { cwd: rootPath },
      (err, stdout) => {
        if (err !== null) {
          return reject(err);
        }

        resolve(stdout);
      }
    );

    forge.stdin?.write(document.getText());
    forge.stdin?.end();
  });

  return [vscode.TextEdit.replace(fullTextRange, formatted)];
}

async function resolveForgeCommand() {
  if (resolvedForgeCommand) {
    return resolvedForgeCommand;
  }

  const potentialForgeCommands = ["forge"];

  if (runningOnWindows()) {
    potentialForgeCommands.push(
      `${process.env.USERPROFILE}\\.cargo\\bin\\forge`
    );
  } else {
    potentialForgeCommands.push(`${process.env.HOME}/.foundry/bin/forge`);
  }

  for (const potentialForgeCommand of potentialForgeCommands) {
    try {
      await runCmd(potentialForgeCommand, [`--version`]);
      resolvedForgeCommand = potentialForgeCommand;

      return potentialForgeCommand;
    } catch (error: any) {
      if (
        error.code === 127 || // unix
        error.code === "ENOENT" || // unix
        error.toString().includes("is not recognized") || // windows (code: 1)
        error.toString().includes("cannot find the path") // windows (code: 1)
      ) {
        // command not found, then try the next potential command
        continue;
      } else {
        // command found but execution failed
        throw error;
      }
    }
  }

  throw new Error(
    `Couldn't find forge binary. Performed lookup: ${JSON.stringify(
      potentialForgeCommands
    )}`
  );
}
