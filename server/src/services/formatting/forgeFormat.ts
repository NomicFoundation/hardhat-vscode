/* eslint-disable @typescript-eslint/no-explicit-any */
import path from "path";
import { TextDocument } from "vscode-languageserver-textdocument";
import { TextEdit } from "vscode-languageserver-types";
import { URI } from "vscode-uri";
import { resolveForgeCommand } from "../../frameworks/Foundry/resolveForgeCommand";
import { Logger } from "../../utils/Logger";
import { execWithInput } from "../../utils/operatingSystem";
import { TimeoutError } from "../../utils/errors";

const FORMAT_TIMEOUT = 2000;

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
  try {
    const { stdout: formattedText } = await execWithInput(
      `${forgeCommand} fmt --raw -`,
      text,
      {
        cwd,
        timeout: FORMAT_TIMEOUT,
      }
    );

    // Build and return a text edit with the entire file content
    const textEdit: TextEdit = {
      range: {
        start: { line: 0, character: 0 },
        end: document.positionAt(text.length),
      },
      newText: formattedText,
    };

    return [textEdit];
  } catch (error: any) {
    if (error.killed) {
      throw new TimeoutError(FORMAT_TIMEOUT);
    } else {
      throw error;
    }
  }
}
