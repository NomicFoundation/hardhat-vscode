import { Position } from "vscode-languageserver-types";

export function normalizeParserPosition(position: {
  line: number;
  column: number;
}): Position {
  return {
    character: position.column,
    line: position.line - 1,
  };
}
