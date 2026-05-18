import { TextDocument } from "vscode-languageserver-textdocument";
import type { Cursor } from "@nomicfoundation/slang/cst" with { "resolution-mode": "import" };

export interface LookupResult {
  cursor: Cursor;
  isSameLine: boolean;
  offset: number;
}

const HEADER_KEYWORDS = new Set([
  "PublicKeyword",
  "PrivateKeyword",
  "InternalKeyword",
  "ExternalKeyword",
  "ViewKeyword",
  "PureKeyword",
  "PayableKeyword",
  "ReturnsKeyword",
]);

/**
 * Find a terminal cursor in a snippet that satisfies `match`, plus contextual
 * information about whether the function header sits on a single line and at
 * what column the header started.
 */
export function lookupCursor(
  cursors: Cursor[],
  document: TextDocument,
  functionSourceLocation: { start: number; end: number },
  match: (cursor: Cursor) => boolean
): LookupResult | null {
  const fn = cursors.find(
    (c) => c.node.isTerminalNode() && c.node.kind === "FunctionKeyword"
  );
  const cursor = cursors.find(match);

  if (fn === undefined || cursor === undefined) {
    return null;
  }

  const isSameLine = determineIsFunctionHeaderOnSameLine(
    fn,
    cursors,
    document,
    functionSourceLocation
  );

  const functionStartPos = document.positionAt(
    functionSourceLocation.start + fn.textRange.start.utf8 + 1
  );
  const offset = functionStartPos.character + 1;

  return { cursor, isSameLine, offset };
}

function determineIsFunctionHeaderOnSameLine(
  fnCursor: Cursor,
  cursors: Cursor[],
  document: TextDocument,
  functionSourceLocation: { start: number; end: number }
): boolean {
  const openBodyBrace = cursors.find(
    (c) => c.node.isTerminalNode() && c.node.kind === "OpenBrace"
  );

  if (openBodyBrace === undefined) {
    return true;
  }

  const fnLine = document.positionAt(
    functionSourceLocation.start + fnCursor.textRange.start.utf8 + 1
  ).line;

  const openBraceLine = document.positionAt(
    functionSourceLocation.start + openBodyBrace.textRange.start.utf8 + 1
  ).line;

  if (fnLine === openBraceLine) {
    return true;
  }

  const keywordLines = cursors
    .filter((c) => c.node.isTerminalNode() && HEADER_KEYWORDS.has(c.node.kind))
    .map((c) =>
      document.positionAt(
        functionSourceLocation.start + c.textRange.start.utf8 + 1
      ).line
    );

  return keywordLines.every((l) => l === fnLine);
}
