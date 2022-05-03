import { CodeAction, CodeActionKind } from "vscode-languageserver/node";
import { ResolveActionsContext } from "../../../types";
import { ParseContractDefinitionResult } from "../../parsing/parseContractDefinition";
import { createAppendFunctionsToContractChange } from "./createAppendFunctionsToContractChange";
import { resolveFunctionsToImplement } from "./resolveFunctionsToImplement";
import { findAnalyzedContract } from "./findAnalyzedContract";
import { ServerState } from "types";

export function buildImplementInterfaceQuickFix(
  serverState: ServerState,
  parseResult: ParseContractDefinitionResult,
  resolveCtx: ResolveActionsContext
): CodeAction | null {
  const contract = findAnalyzedContract(serverState, parseResult, resolveCtx);

  if (contract === null || contract.inheritanceNodes.length === 0) {
    return null;
  }

  const missingFunctions = resolveFunctionsToImplement(contract);

  if (missingFunctions.length === 0) {
    return null;
  }

  const { document, uri } = resolveCtx;

  const change = createAppendFunctionsToContractChange(
    contract,
    missingFunctions,
    { document }
  );

  return {
    title: `Add missing functions from interfaces`,
    kind: CodeActionKind.QuickFix,
    isPreferred: false,
    edit: {
      changes: {
        [uri]: [change],
      },
    },
  };
}
