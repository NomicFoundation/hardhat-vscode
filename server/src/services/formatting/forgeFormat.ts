import path from "path";
import { TextDocument } from "vscode-languageserver-textdocument";
import { TextEdit } from "vscode-languageserver-types";
import { URI } from "vscode-uri";
import { resolveForgeCommand } from "../../frameworks/Foundry/resolveForgeCommand";
import { Logger } from "../../utils/Logger";
import { execWithInput } from "../../utils/operatingSystem";

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

  // Wait for the formatted output
  const execPromise = await execWithInput(
    `${forgeCommand} fmt --raw -`,
    text,
    { cwd },
    2000
  );
  const formattedText = execPromise.stdout;

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
