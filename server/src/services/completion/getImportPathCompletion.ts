import * as lsp from "vscode-languageserver/node";
import { VSCodePosition } from "@common/types";

export function replaceFor(
  filePath: string,
  position: VSCodePosition,
  currentImport: string
) {
  const startingPosition = {
    ...position,
    character: position.character - currentImport.length,
  };

  return lsp.TextEdit.replace(
    lsp.Range.create(startingPosition, position),
    filePath
  );
}
