import { TextDocument } from "vscode-languageserver-textdocument";
import type { Cursor } from "@nomicfoundation/slang/cst" with {
  "resolution-mode": "import",
};

export interface HeaderShape {
  isSameLine: boolean;
  offset: number;
}

export interface LookupResult extends HeaderShape {
  cursor: Cursor;
}

// TerminalKind names of attribute keywords that, if they appear on a line
// other than the `function` keyword, indicate the header has been wrapped
// onto multiple lines.
const HEADER_KEYWORD_KINDS = new Set([
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
 * Compute header shape (isSameLine, indent offset) for a function snippet
 * from its terminal cursors. Returns null only if no FunctionKeyword is
 * present, which shouldn't happen for a parsed FunctionDefinition.
 */
export function getFunctionHeaderShape(
  cursors: Cursor[],
  document: TextDocument,
  functionSourceLocation: { start: number; end: number }
): HeaderShape | null {
  const fn = cursors.find(
    (c) => c.node.isTerminalNode() && c.node.kind === "FunctionKeyword"
  );

  if (fn === undefined) {
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

  return { isSameLine, offset: functionStartPos.character + 1 };
}

/**
 * Find a terminal cursor in the snippet that satisfies `match`, and return
 * it together with the function header shape.
 */
export function lookupCursor(
  cursors: Cursor[],
  document: TextDocument,
  functionSourceLocation: { start: number; end: number },
  match: (cursor: Cursor) => boolean
): LookupResult | null {
  const cursor = cursors.find(match);

  if (cursor === undefined) {
    return null;
  }

  const shape = getFunctionHeaderShape(
    cursors,
    document,
    functionSourceLocation
  );

  if (shape === null) {
    return null;
  }

  return { cursor, ...shape };
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
    .filter(
      (c) => c.node.isTerminalNode() && HEADER_KEYWORD_KINDS.has(c.node.kind)
    )
    .map(
      (c) =>
        document.positionAt(
          functionSourceLocation.start + c.textRange.start.utf8 + 1
        ).line
    );

  return keywordLines.every((l) => l === fnLine);
}
