import {
  CodeAction,
  CodeActionKind,
  Diagnostic,
  Range,
} from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";
import { Token } from "@solidity-parser/parser/dist/src/types";
import { ResolveActionsContext } from "@compilerDiagnostics/types";
import { Logger } from "@utils/Logger";
import { LookupResult, lookupToken } from "../parsing/lookupToken";
import {
  parseFunctionDefinition,
  ParseFunctionDefinitionResult,
} from "../parsing/parseFunctionDefinition";

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

export function resolveInsertSpecifierQuickFix(
  specifier: Specifier,
  diagnostic: Diagnostic,
  { document, uri }: ResolveActionsContext,
  logger: Logger
) {
  if (!diagnostic.data) {
    return [];
  }

  const parseResult = parseFunctionDefinition(diagnostic, document, logger);

  if (parseResult === null) {
    return [];
  }

  const { functionDefinition } = parseResult;

  if (functionDefinition.isVirtual) {
    return buildActionFrom(
      specifier,
      document,
      uri,
      parseResult,
      (t) => t.type === "Keyword" && t.value === "virtual"
    );
  }

  if (
    functionDefinition.visibility === "default" &&
    functionDefinition.stateMutability === null
  ) {
    return buildActionFrom(
      specifier,
      document,
      uri,
      parseResult,
      (t) => t.type === "Punctuator" && t.value === ")"
    );
  }

  if (
    functionDefinition.visibility !== "default" &&
    functionDefinition.stateMutability === null
  ) {
    return buildActionFrom(
      specifier,
      document,
      uri,
      parseResult,
      (t) => t.type === "Keyword" && t.value === functionDefinition.visibility
    );
  }

  if (
    functionDefinition.visibility !== "default" &&
    functionDefinition.stateMutability !== null
  ) {
    return buildActionFrom(
      specifier,
      document,
      uri,
      parseResult,
      (t) =>
        t.type === "Keyword" && t.value === functionDefinition.stateMutability
    );
  }

  return [];
}

function buildActionFrom(
  specifier: Specifier,
  document: TextDocument,
  uri: string,
  parseFnDef: ParseFunctionDefinitionResult,
  tokenSelector: (token: Token) => boolean
) {
  const { tokens, functionSourceLocation } = parseFnDef;

  const lookupResult = lookupToken(
    tokens,
    document,
    functionSourceLocation,
    tokenSelector
  );

  if (lookupResult === null) {
    return [];
  }

  const { token } = lookupResult;

  if (token.range === undefined) {
    return [];
  }

  const change = buildChangeFrom(
    specifier,
    document,
    token,
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
  token: Token,
  { functionSourceLocation }: ParseFunctionDefinitionResult,
  { isSameLine, offset }: LookupResult
) {
  const end = token?.range ? token.range[1] : 0;

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
