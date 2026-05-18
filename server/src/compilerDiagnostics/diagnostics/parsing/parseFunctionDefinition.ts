import { Diagnostic } from "vscode-languageserver/node";
import { TextDocument } from "@common/types";
import type { Cursor } from "@nomicfoundation/slang/cst" with { "resolution-mode": "import" };
import type { ServerState } from "../../../types";
import { parseFunctionDefinition } from "./snippetParsing";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface ParseFunctionDefinitionResult {
  functionDefinition: any;
  cursors: Cursor[];
  functionSourceLocation: { start: number; end: number };
}

/**
 * Parse a function definition from diagnostic data.
 */
export function parseFunctionDefinitionAuto(
  serverState: ServerState,
  diagnostic: Diagnostic,
  document: TextDocument
): Promise<ParseFunctionDefinitionResult | null> {
  return parseFunctionDefinition(diagnostic, document, serverState.logger);
}
