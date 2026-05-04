import { TextDocument } from "vscode-languageserver-textdocument";
import {
  CodeAction,
  Diagnostic,
  Position,
  TextEdit,
} from "vscode-languageserver-types";
import { ServerState } from "../../../types";
import { decodeUriAndRemoveFilePrefix } from "../../../utils";

export function resolveActionsFor(
  serverState: ServerState,
  diagnostic: Diagnostic,
  document: TextDocument,
  uri: string
): CodeAction[] {
  const codeActions: CodeAction[] = [];
  const errorText = document.getText(diagnostic.range);

  if (diagnostic.code === "7576" && errorText === "console") {
    const filePath = decodeUriAndRemoveFilePrefix(uri);
    const solFileEntry = serverState.solFileIndex[filePath];

    if (solFileEntry !== undefined) {
      const insertPosition = getImportInsertPosition(solFileEntry.text);
      codeActions.push({
        title: "Add import from 'hardhat'",
        kind: "quickfix",
        isPreferred: true,
        edit: {
          changes: {
            [uri]: [
              TextEdit.insert(
                insertPosition,
                'import "hardhat/console.sol";\n\n'
              ),
            ],
          },
        },
      });
    }
  }

  return codeActions;
}

function getImportInsertPosition(text: string | undefined): Position {
  if (text === undefined) {
    return { character: 0, line: 0 };
  }

  // Find the first contract/library/interface definition via regex
  const match = /^(?:abstract\s+)?(?:contract|library|interface)\s+/m.exec(
    text
  );

  if (match === null || match.index === undefined) {
    return { character: 0, line: 0 };
  }

  // Count lines up to the match to get the line number
  const prefix = text.slice(0, match.index);
  const line = prefix.split("\n").length - 1;

  return { character: 0, line };
}
