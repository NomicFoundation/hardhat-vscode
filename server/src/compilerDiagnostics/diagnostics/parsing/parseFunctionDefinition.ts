import { Diagnostic } from "vscode-languageserver/node";
import { TextDocument } from "@common/types";
import type { Cursor } from "@nomicfoundation/slang/cst" with { "resolution-mode": "import" };
import type { ServerState } from "../../../types";
import { parseFunctionDefinition } from "./snippetParsing";

/**
 * Structured view of a function definition snippet extracted by Slang.
 * Cursors point at the relevant attribute keywords in the snippet's CST;
 * any may be `undefined` if the corresponding modifier isn't present.
 */
export interface FunctionDefinitionShape {
  type: "FunctionDefinition";
  virtualKeyword: Cursor | undefined;
  visibilityKeyword: Cursor | undefined;
  mutabilityKeyword: Cursor | undefined;
}

export interface ParseFunctionDefinitionResult {
  functionDefinition: FunctionDefinitionShape;
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
