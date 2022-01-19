import { TextDocument } from "vscode-languageserver-textdocument";
import { Token } from "@solidity-parser/parser/dist/src/types";

export type LookupResult = {
  token: Token;
  isSameLine: boolean;
  offset: number;
};

const HEADER_KEYWORDS = [
  "public",
  "private",
  "internal",
  "external",
  "view",
  "pure",
  "payable",
  "returns",
];

export function lookupToken(
  tokens: Token[],
  document: TextDocument,
  functionSourceLocation: { start: number; end: number },
  find: (token: Token) => boolean
): LookupResult | null {
  const fn = tokens.find((t) => t.value === "function");
  const lookupTokenIndex = tokens.findIndex(find);

  const token = tokens[lookupTokenIndex];
  const nextToken = tokens[lookupTokenIndex + 1];

  if (!fn?.range || !token?.range || !nextToken?.range) {
    return null;
  }

  const isSameLine = determineIsFunctionHeaderOnSameLine(
    fn,
    tokens,
    document,
    functionSourceLocation
  );

  const functionStartPos = document.positionAt(
    functionSourceLocation.start + fn.range[0] + 1
  );
  const offset = functionStartPos.character + 1;

  return {
    token,
    isSameLine,
    offset,
  };
}

function determineIsFunctionHeaderOnSameLine(
  functionToken: Token,
  tokens: Token[],
  document: TextDocument,
  functionSourceLocation: { start: number; end: number }
) {
  const openBodyParen = tokens.find(
    (t) => t.type === "Punctuator" && t.value === "{"
  );

  if (!functionToken?.range || !openBodyParen?.range) {
    return true;
  }

  const fnLine = document.positionAt(
    functionSourceLocation.start + functionToken.range[0] + 1
  ).line;

  const openBodyParenLine = document.positionAt(
    functionSourceLocation.start + openBodyParen.range[0] + 1
  ).line;

  if (fnLine === openBodyParenLine) {
    return true;
  }

  const allKeywordsOnSameLineAsFn = tokens
    .filter(
      (t) =>
        (t.type === "Keyword" &&
          t.value &&
          HEADER_KEYWORDS.includes(t.value)) ||
        t.type === "Modifier"
    )
    .map((t) => t.range)
    .filter((r): r is [number, number] => r !== undefined)
    .map(
      (r) => document.positionAt(functionSourceLocation.start + r[0] + 1).line
    )
    .map((l) => l === fnLine)
    .reduce((acc, l) => acc && l, true);

  return allKeywordsOnSameLineAsFn;
}
