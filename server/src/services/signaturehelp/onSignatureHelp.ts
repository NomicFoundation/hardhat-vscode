import { SignatureHelpParams } from "vscode-languageserver/node";
import {
  SignatureHelp,
  ParameterInformation,
} from "@common/types";
import type { CompilationUnit } from "@nomicfoundation/slang/compilation" with { "resolution-mode": "import" };
import type { Cursor, Node } from "@nomicfoundation/slang/cst" with { "resolution-mode": "import" };
import { ServerState } from "../../types";
import { onCommand } from "../../utils/onCommand";
import {
  getCursorAtPosition,
  resolveIdentifierFromCursor,
  resolveToDefinition,
} from "../../parser/slangHelpers";
import { findConstructorInContract } from "../../parser/cstHelpers";

// Cached singleton; constructed once because BaseRewriter lives in the
// ESM-only Slang package and must be loaded via dynamic import.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let commentStripRewriter: any | undefined;

async function getCommentStripRewriter(): Promise<{
  rewriteNode: (node: Node) => Node | undefined;
}> {
  if (commentStripRewriter !== undefined) {
    return commentStripRewriter;
  }

  const { BaseRewriter } = await import("@nomicfoundation/slang/cst");

  class CommentStripRewriter extends BaseRewriter {
    rewriteSingleLineComment() {
      return undefined;
    }
    rewriteMultiLineComment() {
      return undefined;
    }
    rewriteSingleLineNatSpecComment() {
      return undefined;
    }
    rewriteMultiLineNatSpecComment() {
      return undefined;
    }
  }

  commentStripRewriter = new CommentStripRewriter();
  return commentStripRewriter;
}

// Nonterminal kinds whose CST nodes represent a callable site whose arguments
// list we may sit inside (we walk ancestors for any of these).
const CALL_LIKE_KINDS = new Set([
  "FunctionCallExpression",
  "EmitStatement",
  "RevertStatement",
  "NewExpression",
]);

interface CallContext {
  calleeCursor: Cursor;
  activeParameter: number;
}

export const onSignatureHelp = (serverState: ServerState) => {
  return onCommand<SignatureHelpParams, SignatureHelp | null>(
    serverState,
    signatureHelp,
    null
  );
};

async function signatureHelp(
  unit: CompilationUnit,
  internalUri: string,
  params: SignatureHelpParams
): Promise<SignatureHelp | null> {
  const callContext = await findCallContext(
    unit,
    internalUri,
    params.position
  );

  if (callContext === null) {
    return null;
  }

  const { calleeCursor, activeParameter } = callContext;

  const resolution = await resolveIdentifierFromCursor(unit, calleeCursor);

  if (resolution === undefined) {
    return null;
  }

  const definition = resolveToDefinition(resolution);

  if (definition === undefined) {
    return null;
  }

  // For constructor calls (`new Foo()`), the definition resolves to the
  // contract; find the constructor within it.
  const nameLocation = definition.nameLocation;
  if (nameLocation.isUserFileLocation()) {
    const parentCursor = nameLocation.cursor.clone();
    if (
      parentCursor.goToParent() &&
      parentCursor.node.isNonterminalNode() &&
      parentCursor.node.kind === "ContractDefinition"
    ) {
      const ctorCursor = await findConstructorInContract(parentCursor);
      if (ctorCursor !== undefined) {
        return parseSignatureFromNode(ctorCursor.node, activeParameter);
      }
    }
  }

  const definiensLocation = definition.definiensLocation;

  if (!definiensLocation.isUserFileLocation()) {
    return null;
  }

  return parseSignatureFromNode(definiensLocation.cursor.node, activeParameter);
}

/**
 * Walk the CST around the user position to find the enclosing call-like
 * expression. Returns the callee cursor (rightmost identifier inside the
 * call's operand) plus which argument the user is currently editing.
 *
 * CST-based — correctly handles strings, comments, nested calls, and
 * complex type expressions in parameter positions.
 */
async function findCallContext(
  unit: CompilationUnit,
  internalUri: string,
  position: { line: number; character: number }
): Promise<CallContext | null> {
  const cursor = getCursorAtPosition(
    unit,
    internalUri,
    position.line,
    position.character
  );

  if (cursor === undefined) {
    return null;
  }

  const userOffset = cursor.textRange.start.utf8;

  const ancestor = cursor.clone();

  while (ancestor.goToParent()) {
    if (
      !ancestor.node.isNonterminalNode() ||
      !CALL_LIKE_KINDS.has(ancestor.node.kind)
    ) {
      continue;
    }

    const calleeCursor = findCalleeCursor(ancestor.spawn());

    if (calleeCursor === undefined) {
      return null;
    }

    const activeParameter = countArgumentSeparatorsBefore(
      ancestor.spawn(),
      userOffset
    );

    return { calleeCursor, activeParameter };
  }

  return null;
}

/**
 * Find the rightmost Identifier terminal inside the call's operand — i.e.
 * the callable's name. Walks the call expression's direct children skipping
 * the ArgumentsDeclaration child; collects identifiers along the way.
 */
function findCalleeCursor(callCursor: Cursor): Cursor | undefined {
  let lastIdentifier: Cursor | undefined;

  if (!callCursor.goToFirstChild()) {
    return undefined;
  }

  do {
    if (
      callCursor.node.isNonterminalNode() &&
      callCursor.node.kind === "ArgumentsDeclaration"
    ) {
      break;
    }

    // Walk the child subtree for Identifier terminals.
    const sub = callCursor.spawn();
    while (sub.goToNext()) {
      if (
        sub.node.isTerminalNode() &&
        sub.node.kind === "Identifier"
      ) {
        lastIdentifier = sub.clone();
      }
    }
  } while (callCursor.goToNextSibling());

  return lastIdentifier;
}

/**
 * Within a call expression's ArgumentsDeclaration, count the number of
 * top-level argument separators (Commas) whose end is at or before the
 * given offset. That's the active parameter index.
 */
function countArgumentSeparatorsBefore(
  callCursor: Cursor,
  userOffset: number
): number {
  // Descend to ArgumentsDeclaration -> PositionalArgumentsDeclaration ->
  // PositionalArguments. The Commas we want are direct children of the
  // PositionalArguments node (separators of its items).
  const positional = findFirstDescendantOfKind(
    callCursor,
    "PositionalArguments"
  );

  if (positional === undefined) {
    return 0;
  }

  let count = 0;
  const child = positional.spawn();

  if (!child.goToFirstChild()) {
    return 0;
  }

  do {
    if (
      child.node.isTerminalNode() &&
      child.node.kind === "Comma" &&
      child.textRange.end.utf8 <= userOffset
    ) {
      count++;
    }
  } while (child.goToNextSibling());

  return count;
}

function findFirstDescendantOfKind(
  cursor: Cursor,
  kind: string
): Cursor | undefined {
  const c = cursor.spawn();

  while (c.goToNext()) {
    if (c.node.isNonterminalNode() && c.node.kind === kind) {
      return c.clone();
    }
  }

  return undefined;
}

/**
 * Parse a callable CST node (function / constructor / modifier / event /
 * error / etc.) into a SignatureHelp. Strips comments via Rewriter then
 * uses a paren-aware splitter so types like `mapping(K => V)`, tuple
 * `(a, b)`, and function types in parameter positions don't split wrong.
 */
async function parseSignatureFromNode(
  node: Node,
  activeParameter: number
): Promise<SignatureHelp | null> {
  const rawText = node.unparse();
  const documentation = extractLeadingNatspec(rawText);

  const stripper = await getCommentStripRewriter();
  const stripped = stripper.rewriteNode(node);
  const text = (stripped ?? node).unparse().trim();

  const braceIndex = text.indexOf("{");
  let signatureText =
    braceIndex > 0 ? text.substring(0, braceIndex).trim() : text.trim();

  signatureText = signatureText.replace(/;$/, "").trim();
  signatureText = `${signatureText.replace(/\s+/g, " ")} `;

  if (signatureText.trim().length === 0) {
    return null;
  }

  const parenOpen = signatureText.indexOf("(");
  if (parenOpen < 0) {
    return null;
  }

  // Find the matching ')' for parenOpen, tracking nested depth so that types
  // like `mapping(uint => uint)` and `(uint a, uint b)` tuple params don't
  // confuse the matcher.
  const parenClose = findMatchingCloseParen(signatureText, parenOpen);
  if (parenClose < 0) {
    return null;
  }

  const paramString = signatureText.substring(parenOpen + 1, parenClose);
  const parameters: ParameterInformation[] = [];

  if (paramString.trim().length > 0) {
    let argumentOffset = parenOpen + 1;

    for (const param of splitTopLevelCommas(paramString)) {
      parameters.push({
        label: [argumentOffset, argumentOffset + param.length],
      });
      argumentOffset += param.length + 1;
    }
  }

  return {
    signatures: [
      {
        label: signatureText,
        parameters,
        ...(documentation !== undefined ? { documentation } : {}),
      },
    ],
    activeSignature: undefined,
    activeParameter,
  };
}

/**
 * Find the index of the `)` that matches the `(` at `openIndex`, tracking
 * nested paren depth so e.g. `mapping(K => V)` doesn't close prematurely.
 */
function findMatchingCloseParen(text: string, openIndex: number): number {
  let depth = 1;

  for (let i = openIndex + 1; i < text.length; i++) {
    if (text[i] === "(") {
      depth++;
    } else if (text[i] === ")") {
      depth--;
      if (depth === 0) {
        return i;
      }
    }
  }

  return -1;
}

/**
 * Split a parameter list on top-level commas only. Commas nested inside
 * parentheses (mapping, function-type, tuple) are not separators.
 */
function splitTopLevelCommas(paramString: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = "";

  for (let i = 0; i < paramString.length; i++) {
    const c = paramString[i];

    if (c === "(") {
      depth++;
    } else if (c === ")") {
      depth--;
    } else if (c === "," && depth === 0) {
      parts.push(current);
      current = "";
      continue;
    }

    current += c;
  }

  if (current.length > 0) {
    parts.push(current);
  }

  return parts;
}

/**
 * Extract natspec documentation that appears at the START of the unparsed
 * text — i.e. as leading trivia of the callable. Anchored to `^` so a block
 * comment in the function body that happens to look like natspec doesn't
 * get picked up.
 */
function extractLeadingNatspec(text: string): string | undefined {
  // Multi-line natspec (anchored to start, optional leading whitespace)
  const multiLineMatch = text.match(/^\s*\/\*\*([\s\S]*?)\*\//);

  if (multiLineMatch !== null) {
    const commentText = multiLineMatch[1]
      .split("\n")
      .map((l) => l.trim().replace(/^\*\s?/, "").trim())
      .filter((l) => l.length > 0 && !l.startsWith("@"))
      .join(" ")
      .trim();

    if (commentText.length > 0) {
      return commentText;
    }
  }

  // Triple-slash natspec lines, consecutively from start
  const singleLineMatch = text.match(/^\s*((?:\/\/\/[^\n]*\n\s*)+)/);

  if (singleLineMatch !== null) {
    const lines = singleLineMatch[1].match(/\/\/\/[^\n]*/g);

    if (lines !== null) {
      const commentText = lines
        .map((l) => l.replace(/^\/\/\/\s?/, "").trim())
        .filter((l) => l.length > 0 && !l.startsWith("@"))
        .join(" ")
        .trim();

      if (commentText.length > 0) {
        return commentText;
      }
    }
  }

  return undefined;
}
