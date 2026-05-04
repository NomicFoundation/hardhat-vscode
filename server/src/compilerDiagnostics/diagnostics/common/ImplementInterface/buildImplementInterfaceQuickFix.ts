import { CodeAction, CodeActionKind } from "vscode-languageserver/node";
import { ResolveActionsContext } from "../../../types";
import { ParseContractDefinitionResult } from "../../parsing/parseContractDefinition";
import { ServerState } from "../../../../types";
import { createAppendFunctionsToContractChange } from "./createAppendFunctionsToContractChange";
import { resolveFunctionsToImplement } from "./resolveFunctionsToImplement";
import { resolveContractInfo } from "./resolveContractInfo";

export async function buildImplementInterfaceQuickFix(
  serverState: ServerState,
  parseResult: ParseContractDefinitionResult,
  resolveCtx: ResolveActionsContext
): Promise<CodeAction | null> {
  const contract = await resolveContractInfo(
    serverState,
    parseResult,
    resolveCtx
  );

  if (contract === null || contract.parents.length === 0) {
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
