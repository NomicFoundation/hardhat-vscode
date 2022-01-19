import {
  CodeAction,
  CodeActionKind,
  Diagnostic,
  Range,
} from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";
import {
  parseFunctionDefinition,
  ParseFunctionDefinitionResult,
} from "../parsing/parseFunctionDefinition";
import { LookupResult, lookupToken } from "../parsing/lookupToken";
import { Token } from "@solidity-parser/parser/dist/src/types";

type Specifier = "virtual" | "override";

export function resolveInsertSpecifierQuickFix(
  specifier: Specifier,
  diagnostic: Diagnostic,
  { document, uri }: { document: TextDocument; uri: string }
) {
  if (!diagnostic.data) {
    return [];
  }

  const parseResult = parseFunctionDefinition(diagnostic, document);

  if (parseResult === null) {
    return [];
  }

  const { functionDefinition } = parseResult;

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
  parseFunctionDefinition: ParseFunctionDefinitionResult,
  tokenSelector: (token: Token) => boolean
) {
  const { tokens, functionSourceLocation } = parseFunctionDefinition;

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
    parseFunctionDefinition,
    lookupResult
  );

  const action: CodeAction = {
    title: "Add override specifier to function definition",
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
