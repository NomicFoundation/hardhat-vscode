import { ContractDefinitionNode, FunctionDefinition } from "@common/types";
import { FunctionRecord, LinearizationContext } from "../types";
import { resolveImplementationOverrides } from "./resolveImplementationOverrides";

export function convertFunctionRecordsToMissingImplementations(
  contractNode: ContractDefinitionNode,
  functions: FunctionRecord[],
  linearizationCtx: LinearizationContext
) {
  return functions
    .map((fr) =>
      convertFunctionRecordToImplementation(fr, contractNode, linearizationCtx)
    )
    .filter(isAbstractOrHasMultipleOverrides)
    .map(({ definition }) => definition);
}

function convertFunctionRecordToImplementation(
  fun: FunctionRecord,
  contractNode: ContractDefinitionNode,
  linearizationCtx: LinearizationContext
): { isAbstract: boolean; definition: FunctionDefinition } {
  const definition: FunctionDefinition = fun.definition;

  const isAbstract = !definition.body;

  definition.override = resolveImplementationOverrides(
    fun,
    isAbstract,
    contractNode,
    linearizationCtx
  );

  definition.body = {
    type: "Block",
    statements: [],
  };

  return { isAbstract, definition };
}

/**
 * Our test for whether we substitute in a dummy function
 * implementation is: is function abstract or has there been
 * an implementation but there is more than one required override
 * so a warning will show if it is left out.
 *
 * @param isImplementation - is the function being considered not abstract
 * @param overrides - the number of overrides the function has to show
 * @returns whether the function should be inserted as a dummy implementation in the contract
 */
function isAbstractOrHasMultipleOverrides({
  isAbstract,
  definition,
}: {
  isAbstract: boolean;
  definition: FunctionDefinition;
}) {
  return (
    isAbstract ||
    (definition.override !== null && definition.override.length > 1)
  );
}
