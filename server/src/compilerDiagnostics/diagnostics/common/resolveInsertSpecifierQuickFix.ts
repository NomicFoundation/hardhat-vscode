import {
  CodeAction,
  CodeActionKind,
  Diagnostic,
  Range,
} from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";
import type { Cursor } from "@nomicfoundation/slang/cst" with { "resolution-mode": "import" };
import { ResolveActionsContext } from "@compilerDiagnostics/types";
import { LookupResult, lookupCursor } from "../parsing/lookupToken";
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

  const { functionDefinition } = parseResult;

  if (functionDefinition.isVirtual) {
    return buildActionFrom(specifier, document, uri, parseResult, (c) =>
      isTerminalKind(c, "VirtualKeyword")
    );
  }

  if (
    functionDefinition.visibility === "default" &&
    functionDefinition.stateMutability === null
  ) {
    return buildActionFrom(specifier, document, uri, parseResult, (c) =>
      isTerminalKind(c, "CloseParen")
    );
  }

  if (
    functionDefinition.visibility !== "default" &&
    functionDefinition.stateMutability === null
  ) {
    return buildActionFrom(specifier, document, uri, parseResult, (c) =>
      isTerminalKind(c, visibilityToKeywordKind(functionDefinition.visibility))
    );
  }

  if (
    functionDefinition.visibility !== "default" &&
    functionDefinition.stateMutability !== null
  ) {
    return buildActionFrom(specifier, document, uri, parseResult, (c) =>
      isTerminalKind(
        c,
        mutabilityToKeywordKind(functionDefinition.stateMutability)
      )
    );
  }

  return [];
}

function isTerminalKind(cursor: Cursor, kind: string): boolean {
  return cursor.node.isTerminalNode() && cursor.node.kind === kind;
}

function visibilityToKeywordKind(visibility: string): string {
  switch (visibility) {
    case "public":
      return "PublicKeyword";
    case "private":
      return "PrivateKeyword";
    case "internal":
      return "InternalKeyword";
    case "external":
      return "ExternalKeyword";
    default:
      return "";
  }
}

function mutabilityToKeywordKind(mutability: string): string {
  switch (mutability) {
    case "view":
      return "ViewKeyword";
    case "pure":
      return "PureKeyword";
    case "payable":
      return "PayableKeyword";
    default:
      return "";
  }
}

function buildActionFrom(
  specifier: Specifier,
  document: TextDocument,
  uri: string,
  parseFnDef: ParseFunctionDefinitionResult,
  cursorMatcher: (cursor: Cursor) => boolean
) {
  const { cursors, functionSourceLocation } = parseFnDef;

  const lookupResult = lookupCursor(
    cursors,
    document,
    functionSourceLocation,
    cursorMatcher
  );

  if (lookupResult === null) {
    return [];
  }

  const change = buildChangeFrom(
    specifier,
    document,
    lookupResult.cursor,
    parseFnDef,
    lookupResult
  );

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

function buildChangeFrom(
  specifier: Specifier,
  document: TextDocument,
  cursor: Cursor,
  { functionSourceLocation }: ParseFunctionDefinitionResult,
  { isSameLine, offset }: LookupResult
) {
  const end = cursor.textRange.end.utf8;

  const position = document.positionAt(
    functionSourceLocation.start + end + (isSameLine ? 0 : 1)
  );

  return {
    newText: isSameLine
      ? ` ${specifier}`
      : `${"".padStart(offset)}${specifier}\n`,
    range: Range.create(position, position),
  };
}

function buildTitle(specifier: Specifier | Multioverride) {
  const specifierText =
    specifier instanceof Multioverride ? specifier.toDisplayName() : specifier;

  return `Add ${specifierText} specifier to function definition`;
}
