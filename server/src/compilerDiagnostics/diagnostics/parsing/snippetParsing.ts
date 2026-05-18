/**
 * Snippet parsing utilities for code actions.
 * These implement parseFunctionDefinition and parseContractDefinition
 * using the CST Parser API.
 *
 * The output types are compatible with the existing diagnostic handlers
 * (same Token format, same FunctionDefinition/ContractDefinition shape).
 */
import type {
  Cursor,
  NonterminalKind as NonterminalKindType,
  TerminalKind as TerminalKindType,
} from "@nomicfoundation/slang/cst" with { "resolution-mode": "import" };
import { Diagnostic, Range } from "vscode-languageserver/node";
import { TextDocument } from "@common/types";
import { ResolveActionsContext } from "@compilerDiagnostics/types";
import { Logger } from "@utils/Logger";
import { ParseFunctionDefinitionResult } from "./parseFunctionDefinition";
import { ParseContractDefinitionResult } from "./parseContractDefinition";

// Cached kind enums (loaded once via dynamic import; reused per call).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _kinds: { TerminalKind: any; NonterminalKind: any } | undefined;

async function getKinds(): Promise<{
  TerminalKind: typeof TerminalKindType;
  NonterminalKind: typeof NonterminalKindType;
}> {
  if (_kinds !== undefined) {
    return _kinds;
  }
  const m = await import("@nomicfoundation/slang/cst");
  _kinds = { TerminalKind: m.TerminalKind, NonterminalKind: m.NonterminalKind };
  return _kinds;
}

/**
 * Collect every terminal-node cursor under `cursor` in pre-order traversal.
 * Each returned cursor is a clone — callers can iterate freely without
 * mutating the source cursor.
 */
function collectTerminalCursors(cursor: Cursor): Cursor[] {
  const cursors: Cursor[] = [];
  const c = cursor.spawn();

  while (c.goToNext()) {
    if (c.node.isTerminalNode()) {
      cursors.push(c.clone());
    }
  }

  return cursors;
}

/**
 * Walk the snippet for the visibility / mutability / virtual keyword cursors.
 * Returns each as a Cursor (or undefined if absent). Callers branch on the
 * cursor's TerminalKind directly and use its textRange for insertion offsets,
 * so there's no string↔kind round-trip elsewhere in the pipeline.
 *
 * Safe because a FunctionDefinition snippet's keywords of these kinds can
 * only appear in `FunctionAttributes`; they don't appear inside the body
 * (where identifiers, not keyword TerminalKinds, are present).
 */
function extractFunctionKeywordCursors(
  cursor: Cursor,
  TerminalKind: typeof TerminalKindType
): {
  virtualKeyword: Cursor | undefined;
  visibilityKeyword: Cursor | undefined;
  mutabilityKeyword: Cursor | undefined;
} {
  let virtualKeyword: Cursor | undefined;
  let visibilityKeyword: Cursor | undefined;
  let mutabilityKeyword: Cursor | undefined;

  const c = cursor.spawn();
  while (c.goToNext()) {
    if (!c.node.isTerminalNode()) {
      continue;
    }

    switch (c.node.kind) {
      case TerminalKind.VirtualKeyword:
        virtualKeyword = c.clone();
        break;
      case TerminalKind.PublicKeyword:
      case TerminalKind.PrivateKeyword:
      case TerminalKind.InternalKeyword:
      case TerminalKind.ExternalKeyword:
        visibilityKeyword = c.clone();
        break;
      case TerminalKind.ViewKeyword:
      case TerminalKind.PureKeyword:
      case TerminalKind.PayableKeyword:
        mutabilityKeyword = c.clone();
        break;
    }
  }

  return { virtualKeyword, visibilityKeyword, mutabilityKeyword };
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

    const cursors = collectTerminalCursors(cursor.clone());

    if (cursors.length === 0) {
      return null;
    }

    // Check that the root is a FunctionDefinition
    const rootNode = tree.asNonterminalNode();

    if (rootNode === undefined || rootNode.kind !== NonterminalKind.FunctionDefinition) {
      return null;
    }

    const { TerminalKind } = await getKinds();
    const keywords = extractFunctionKeywordCursors(cursor.clone(), TerminalKind);

    const functionDefinition = {
      type: "FunctionDefinition",
      ...keywords,
    };

    return { functionDefinition, cursors, functionSourceLocation };
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

    const cursors = collectTerminalCursors(cursor.clone());

    if (cursors.length === 0) {
      return null;
    }

    const rootNode = tree.asNonterminalNode();

    if (rootNode === undefined || rootNode.kind !== NonterminalKind.ContractDefinition) {
      return null;
    }

    const contractDefinition = {
      type: "ContractDefinition",
      range: [0, contractText.length - 1],
    };

    return {
      contractDefinition,
      cursors,
      functionSourceLocation,
      contractText,
    };
  } catch (err) {
    logger.error(err);
    return null;
  }
}
