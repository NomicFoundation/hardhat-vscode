/* eslint-disable @typescript-eslint/no-explicit-any */
import * as vscode from "vscode";
import * as cp from "child_process";
import { runCmd, runningOnWindows } from "../utils/os";

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
    const currentDocument = vscode.window.activeTextEditor?.document.uri;
    const rootPath = currentDocument
      ? vscode.workspace.getWorkspaceFolder(currentDocument)?.uri.fsPath
      : undefined;

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
      await runCmd(`${potentialForgeCommand} --version`);
      return potentialForgeCommand;
    } catch (error: any) {
      if (
        error.code === 127 || // unix
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
