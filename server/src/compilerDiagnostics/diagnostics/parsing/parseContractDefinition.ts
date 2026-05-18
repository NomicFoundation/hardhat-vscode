import { Diagnostic } from "vscode-languageserver/node";
import { ResolveActionsContext } from "@compilerDiagnostics/types";
import type { Cursor } from "@nomicfoundation/slang/cst" with { "resolution-mode": "import" };
import type { ServerState } from "../../../types";
import { parseContractDefinition } from "./snippetParsing";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface ParseContractDefinitionResult {
  contractDefinition: any;
  cursors: Cursor[];
  functionSourceLocation: { start: number; end: number };
  contractText: string;
}

/**
 * Parse a contract definition from diagnostic data.
 */
export function parseContractDefinitionAuto(
  serverState: ServerState,
  diagnostic: Diagnostic,
  context: ResolveActionsContext
): Promise<ParseContractDefinitionResult | null> {
  return parseContractDefinition(
    diagnostic,
    context,
    serverState.logger
  );
}
