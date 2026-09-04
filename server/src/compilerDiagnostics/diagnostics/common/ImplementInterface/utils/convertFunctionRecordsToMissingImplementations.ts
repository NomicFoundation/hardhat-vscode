import {
  ContractInfo,
  FunctionInfo,
  FunctionRecord,
  LinearizationContext,
} from "../types";
import {
  resolveImplementationOverrides,
  OverrideEntry,
} from "./resolveImplementationOverrides";

export interface ResolvedFunction {
  info: FunctionInfo;
  overrides: OverrideEntry[];
}

export function convertFunctionRecordsToMissingImplementations(
  contractNode: ContractInfo,
  functions: FunctionRecord[],
  linearizationCtx: LinearizationContext
): ResolvedFunction[] {
  return functions
    .map((fr) =>
      convertFunctionRecordToImplementation(fr, contractNode, linearizationCtx)
    )
    .filter(isAbstractOrHasMultipleOverrides);
}

function convertFunctionRecordToImplementation(
  fun: FunctionRecord,
  contractNode: ContractInfo,
  linearizationCtx: LinearizationContext
): { isAbstract: boolean; info: FunctionInfo; overrides: OverrideEntry[] } {
  const info = fun.definition;
  const isAbstract = !info.hasBody;

  const overrides = resolveImplementationOverrides(
    fun,
    isAbstract,
    contractNode,
    linearizationCtx
  );

  return { isAbstract, info, overrides };
}

/**
 * Test for whether we substitute in a dummy function implementation:
 * is function abstract or has there been an implementation but there is
 * more than one required override so a warning will show if left out.
 */
function isAbstractOrHasMultipleOverrides({
  isAbstract,
  overrides,
}: {
  isAbstract: boolean;
  overrides: OverrideEntry[];
}): boolean {
  return isAbstract || overrides.length > 1;
}
