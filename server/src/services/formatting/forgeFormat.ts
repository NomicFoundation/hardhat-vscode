import * as cp from "child_process";
import path from "path";
import { TextDocument } from "vscode-languageserver-textdocument";
import { TextEdit } from "vscode-languageserver-types";
import { URI } from "vscode-uri";
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

  const formattedText = cp
    .execSync(`${forgeCommand} fmt --raw -`, {
      cwd,
      input: text,
      stdio: "pipe",
    })
    .toString();

  const textEdit: TextEdit = {
    range: {
      start: { line: 0, character: 0 },
      end: document.positionAt(text.length),
    },
    newText: formattedText,
  };

  return [textEdit];
}
