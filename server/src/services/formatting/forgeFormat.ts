import * as cp from "child_process";
import path from "path";
import { TextDocument } from "vscode-languageserver-textdocument";
import { TextEdit } from "vscode-languageserver-types";
import { URI } from "vscode-uri";
import { promisify } from "util";
import { resolveForgeCommand } from "../../frameworks/Foundry/resolveForgeCommand";
import { Logger } from "../../utils/Logger";

export async function forgeFormat(
  text: string,
  document: TextDocument,
  logger: Logger
) {
  const forgeCommand = await resolveForgeCommand();
  const documentPath = URI.parse(document.uri).fsPath;
  const cwd = path.dirname(documentPath);

  logger.trace(`Forge command: ${forgeCommand}`);
  logger.trace(`CWD: ${cwd}`);

  // Spawn and promisify the forge fmt process
  const execPromise = promisify(cp.exec)(`${forgeCommand} fmt --raw -`, {
    cwd,
  });

  // Write the file contents to the process
  const { child } = execPromise;
  child.stdin?.write(text);
  child.stdin?.end();

  // Set a time limit
  setTimeout(() => {
    child.kill("SIGKILL");
  }, 2000);

  // Wait for the formatted output
  const formattedText = (await execPromise).stdout;

  // Build and return a text edit with the entire file content
  const textEdit: TextEdit = {
    range: {
      start: { line: 0, character: 0 },
      end: document.positionAt(text.length),
    },
    newText: formattedText,
  };

  return [textEdit];
}
