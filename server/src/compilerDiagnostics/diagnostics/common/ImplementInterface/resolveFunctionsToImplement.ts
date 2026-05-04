import { ContractInfo } from "./types";
import {
  ResolvedFunction,
  convertFunctionRecordsToMissingImplementations,
} from "./utils/convertFunctionRecordsToMissingImplementations";
import { resolveAllContractFunctions } from "./utils/resolveAllContractFunctions";
import { methodResoltionOrdersFor } from "./utils/methodResolutionOrdersFor";

export function resolveFunctionsToImplement(
  contractNode: ContractInfo
): ResolvedFunction[] {
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
