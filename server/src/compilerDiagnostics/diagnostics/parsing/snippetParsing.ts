/**
 * Snippet parsing utilities for code actions.
 * These implement parseFunctionDefinition and parseContractDefinition
 * using the CST Parser API.
 *
 * The output types are compatible with the existing diagnostic handlers
 * (same Token format, same FunctionDefinition/ContractDefinition shape).
 */
import type { Cursor } from "@nomicfoundation/slang/cst" with { "resolution-mode": "import" };
import { Diagnostic, Range } from "vscode-languageserver/node";
import { TextDocument } from "@common/types";
import { ResolveActionsContext } from "@compilerDiagnostics/types";
import { Logger } from "@utils/Logger";
import { Token } from "./types";
import { ParseFunctionDefinitionResult } from "./parseFunctionDefinition";
import { ParseContractDefinitionResult } from "./parseContractDefinition";

/**
 * Map TerminalKind to Token type.
 */
function terminalKindToTokenType(kind: string): string {
  // Keywords
  if (kind.endsWith("Keyword")) {
    return "Keyword";
  }

  // Punctuators
  if (
    [
      "OpenParen",
      "CloseParen",
      "OpenBrace",
      "CloseBrace",
      "OpenBracket",
      "CloseBracket",
      "Semicolon",
      "Comma",
      "Period",
      "Equal",
      "Plus",
      "Minus",
      "Asterisk",
      "Slash",
      "Percent",
      "Ampersand",
      "Bar",
      "Caret",
      "Tilde",
      "ExclamationMark",
      "QuestionMark",
      "Colon",
      "LessThan",
      "GreaterThan",
    ].includes(kind)
  ) {
    return "Punctuator";
  }

  if (kind === "Identifier") {
    return "Identifier";
  }

  // Everything else
  return kind;
}

/**
 * Collect all terminal nodes from a CST cursor as Token-compatible objects.
 * Character offsets are relative to the snippet start (0-based).
 */
function collectTokens(cursor: Cursor): Token[] {
  const tokens: Token[] = [];

  const walk = (c: Cursor): void => {
    if (c.node.isTerminalNode()) {
      const kind = c.node.kind;
      const text = c.node.unparse();
      const range = c.textRange;

      // Convert line/column to character offset within the snippet
      // Since we're parsing a snippet, use textOffset if available
      tokens.push({
        type: terminalKindToTokenType(kind),
        value: text,
        range: [range.start.utf8, range.end.utf8],
      } as Token);
    }

    if (c.goToFirstChild()) {
      walk(c);
      c.goToParent();
    }

    while (c.goToNextSibling()) {
      if (c.node.isTerminalNode()) {
        const kind = c.node.kind;
        const text = c.node.unparse();
        const range = c.textRange;

        tokens.push({
          type: terminalKindToTokenType(kind),
          value: text,
          range: [range.start.utf8, range.end.utf8],
        } as Token);
      }

      if (c.goToFirstChild()) {
        walk(c);
        c.goToParent();
      }
    }
  };

  walk(cursor);
  return tokens;
}

/**
 * Extract a FunctionDefinition-compatible object from a CST.
 */
function extractFunctionDefinitionProps(cursor: Cursor) {
  let isVirtual = false;
  let visibility: "private" | "public" | "external" | "internal" | "default" =
    "default";
  let stateMutability: string | null = null;

  const walk = (c: Cursor): void => {
    const node = c.node;

    if (node.isTerminalNode()) {
      switch (node.kind) {
        case "VirtualKeyword":
          isVirtual = true;
          break;
        case "PublicKeyword":
          visibility = "public";
          break;
        case "PrivateKeyword":
          visibility = "private";
          break;
        case "InternalKeyword":
          visibility = "internal";
          break;
        case "ExternalKeyword":
          visibility = "external";
          break;
        case "ViewKeyword":
          stateMutability = "view";
          break;
        case "PureKeyword":
          stateMutability = "pure";
          break;
        case "PayableKeyword":
          stateMutability = "payable";
          break;
      }
    }

    if (c.goToFirstChild()) {
      walk(c);
      c.goToParent();
    }

    while (c.goToNextSibling()) {
      walk(c);
    }
  };

  walk(cursor);

  return { isVirtual, visibility, stateMutability };
}

/**
 * Parse a function snippet and return a FunctionDefinition-compatible result.
 */
export async function parseFunctionDefinition(
  diagnostic: Diagnostic,
  document: TextDocument,
  logger: Logger
): Promise<ParseFunctionDefinitionResult | null> {
  if (!diagnostic.data) {
    return null;
  }

  try {
    const { functionSourceLocation } = diagnostic.data as {
      functionSourceLocation: { start: number; end: number };
    };

    const functionText = document.getText(
      Range.create(
        document.positionAt(functionSourceLocation.start),
        document.positionAt(functionSourceLocation.end)
      )
    );

    const { Parser } = await import("@nomicfoundation/slang/parser");
    const { NonterminalKind } = await import("@nomicfoundation/slang/cst");
    const { LanguageFacts } = await import("@nomicfoundation/slang/utils");

    // Use latest version for snippet parsing (the snippet is small and syntax is stable)
    const versions = LanguageFacts.allVersions();
    const version = versions[versions.length - 1];
    const parser = Parser.create(version);

    // Try parsing as a FunctionDefinition nonterminal
    const output = parser.parseNonterminal(
      NonterminalKind.FunctionDefinition,
      functionText
    );

    const tree = output.tree;
    const cursor = tree.createCursor({ utf8: 0, utf16: 0, line: 0, column: 0 });

    // Collect tokens
    const tokens = collectTokens(cursor.clone());

    if (tokens.length === 0) {
      return null;
    }

    // Check that the root is a FunctionDefinition
    const rootNode = tree.asNonterminalNode();

    if (rootNode === undefined || rootNode.kind !== "FunctionDefinition") {
      return null;
    }

    // Extract function properties
    const props = extractFunctionDefinitionProps(cursor.clone());

    if (props === undefined) {
      return null;
    }

    // Build a FunctionDefinition-compatible object with the properties
    // that resolveInsertSpecifierQuickFix actually uses
    const functionDefinition = {
      type: "FunctionDefinition",
      isVirtual: props.isVirtual ?? false,
      visibility: props.visibility ?? "default",
      stateMutability: props.stateMutability ?? null,
    };

    return { functionDefinition, tokens, functionSourceLocation };
  } catch (err) {
    logger.error(err);
    return null;
  }
}

/**
 * Parse a contract snippet and return a ContractDefinition-compatible result.
 */
export async function parseContractDefinition(
  diagnostic: Diagnostic,
  { document }: ResolveActionsContext,
  logger: Logger
): Promise<ParseContractDefinitionResult | null> {
  if (!diagnostic.data) {
    return null;
  }

  try {
    const { functionSourceLocation } = diagnostic.data as {
      functionSourceLocation: { start: number; end: number };
    };

    const contractText = document.getText(
      Range.create(
        document.positionAt(functionSourceLocation.start),
        document.positionAt(functionSourceLocation.end)
      )
    );

    const { Parser } = await import("@nomicfoundation/slang/parser");
    const { NonterminalKind } = await import("@nomicfoundation/slang/cst");
    const { LanguageFacts } = await import("@nomicfoundation/slang/utils");

    const versions = LanguageFacts.allVersions();
    const version = versions[versions.length - 1];
    const parser = Parser.create(version);

    const output = parser.parseNonterminal(
      NonterminalKind.ContractDefinition,
      contractText
    );

    const tree = output.tree;
    const cursor = tree.createCursor({ utf8: 0, utf16: 0, line: 0, column: 0 });

    const tokens = collectTokens(cursor.clone());

    if (tokens.length === 0) {
      return null;
    }

    const rootNode = tree.asNonterminalNode();

    if (rootNode === undefined || rootNode.kind !== "ContractDefinition") {
      return null;
    }

    // jsparser range[1] points to the last character (not past it),
    // so subtract 1 from the text length to match that convention.
    const contractDefinition = {
      type: "ContractDefinition",
      range: [0, contractText.length - 1],
    };

    return {
      contractDefinition,
      tokens,
      functionSourceLocation,
      contractText,
    };
  } catch (err) {
    logger.error(err);
    return null;
  }
}
