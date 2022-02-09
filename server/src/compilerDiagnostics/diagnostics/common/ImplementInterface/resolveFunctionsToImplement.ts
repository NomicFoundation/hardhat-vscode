import { ContractDefinitionNode, FunctionDefinition } from "@common/types";
import { resolveAllContractFunctions } from "./utils/resolveAllContractFunctions";
import { methodResoltionOrdersFor } from "./utils/methodResolutionOrdersFor";
import { convertFunctionRecordsToMissingImplementations } from "./utils/convertFunctionRecordsToMissingImplementations";

export function resolveFunctionsToImplement(
  contractNode: ContractDefinitionNode
): FunctionDefinition[] {
  const linearizationCtx = methodResoltionOrdersFor(contractNode);

  const combinedFunctionRecords = resolveAllContractFunctions(
    contractNode,
    linearizationCtx
  );

  const missingFunctions = convertFunctionRecordsToMissingImplementations(
    contractNode,
    combinedFunctionRecords,
    linearizationCtx
  );

  return missingFunctions;
}
