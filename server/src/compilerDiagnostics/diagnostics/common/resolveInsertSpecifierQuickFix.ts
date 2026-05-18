import {
  CodeAction,
  CodeActionKind,
  Diagnostic,
  Range,
} from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";
import type { Cursor } from "@nomicfoundation/slang/cst" with { "resolution-mode": "import" };
import { ResolveActionsContext } from "@compilerDiagnostics/types";
import {
  getFunctionHeaderShape,
  HeaderShape,
  lookupCursor,
} from "../parsing/lookupToken";
import {
  parseFunctionDefinitionAuto,
  ParseFunctionDefinitionResult,
} from "../parsing/parseFunctionDefinition";
import type { ServerState } from "../../../types";

export class Multioverride {
  public contractIdentifiers: string[];

  constructor(contractIdentifiers: string[]) {
    this.contractIdentifiers = contractIdentifiers;
  }

  public toDisplayName(): string {
    return "override(...)";
  }

  public toString(): string {
    return `override(${this.contractIdentifiers.sort().join(", ")})`;
  }
}

type Specifier = "virtual" | "override" | Multioverride;

export async function resolveInsertSpecifierQuickFix(
  specifier: Specifier,
  diagnostic: Diagnostic,
  { document, uri }: ResolveActionsContext,
  serverState: ServerState
) {
  if (!diagnostic.data) {
    return [];
  }

  const parseResult = await parseFunctionDefinitionAuto(
    serverState,
    diagnostic,
    document
  );

  if (parseResult === null) {
    return [];
  }

  const { functionDefinition, cursors, functionSourceLocation } = parseResult;
  const { virtualKeyword, visibilityKeyword, mutabilityKeyword } =
    functionDefinition;

  // Pick the keyword to insert *after*. Order matters: an existing virtual
  // overrides everything (insert after it); then mutability if present;
  // then visibility; finally fall back to the close-paren of the params.
  let targetCursor: Cursor | undefined;

  if (virtualKeyword !== undefined) {
    targetCursor = virtualKeyword;
  } else if (mutabilityKeyword !== undefined) {
    targetCursor = mutabilityKeyword;
  } else if (visibilityKeyword !== undefined) {
    targetCursor = visibilityKeyword;
  }

  if (targetCursor !== undefined) {
    const shape = getFunctionHeaderShape(cursors, document, functionSourceLocation);

    if (shape === null) {
      return [];
    }

    return buildAction(specifier, document, uri, parseResult, targetCursor, shape);
  }

  // No virtual/visibility/mutability — insert after the parameters' `)`.
  const { TerminalKind } = await import("@nomicfoundation/slang/cst");
  const lookupResult = lookupCursor(
    cursors,
    document,
    functionSourceLocation,
    (c) => c.node.isTerminalNode() && c.node.kind === TerminalKind.CloseParen
  );

  if (lookupResult === null) {
    return [];
  }

  return buildAction(
    specifier,
    document,
    uri,
    parseResult,
    lookupResult.cursor,
    lookupResult
  );
}

function buildAction(
  specifier: Specifier,
  document: TextDocument,
  uri: string,
  parseFnDef: ParseFunctionDefinitionResult,
  targetCursor: Cursor,
  shape: HeaderShape
): CodeAction[] {
  const { functionSourceLocation } = parseFnDef;
  const end = targetCursor.textRange.end.utf8;

  const position = document.positionAt(
    functionSourceLocation.start + end + (shape.isSameLine ? 0 : 1)
  );

  const change = {
    newText: shape.isSameLine
      ? ` ${specifier}`
      : `${"".padStart(shape.offset)}${specifier}\n`,
    range: Range.create(position, position),
  };

  const action: CodeAction = {
    title: buildTitle(specifier),
    kind: CodeActionKind.QuickFix,
    isPreferred: true,
    edit: {
      changes: {
        [uri]: [change],
      },
    },
  };

  return [action];
}

function buildTitle(specifier: Specifier | Multioverride) {
  const specifierText =
    specifier instanceof Multioverride ? specifier.toDisplayName() : specifier;

  return `Add ${specifierText} specifier to function definition`;
}
