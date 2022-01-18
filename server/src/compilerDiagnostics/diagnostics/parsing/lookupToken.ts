import { TextDocument } from "vscode-languageserver-textdocument";
import { Token } from "@solidity-parser/parser/dist/src/types";

export function lookupToken(
  tokens: Token[],
  document: TextDocument,
  functionSourceLocation: { start: number; end: number },
  find: (token: Token) => boolean
) {
  const lookupTokenIndex = tokens.findIndex(find);

  const lookupToken = tokens[lookupTokenIndex];
  const nextToken = tokens[lookupTokenIndex + 1];

  if (!lookupToken || !lookupToken.range || !nextToken || !nextToken.range) {
    return null;
  }

  const visibilityKeywordPosition = document.positionAt(
    functionSourceLocation.start + lookupToken.range[0] + 1
  );
  const visibilityKeywordLine = visibilityKeywordPosition.line;
  const nextTokenLine = document.positionAt(
    functionSourceLocation.start + nextToken.range[0] + 1
  ).line;

  const isSameLine = visibilityKeywordLine === nextTokenLine;

  return { token: lookupToken, isSameLine };
}
