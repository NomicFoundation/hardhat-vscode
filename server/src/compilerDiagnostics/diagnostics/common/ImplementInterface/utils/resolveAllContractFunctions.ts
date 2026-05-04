import {
  ContractInfo,
  FunctionInfo,
  FunctionRecord,
  LinearizationContext,
} from "../types";
import { toContractId } from "./toContractId";

const visibilityPrecedence: Array<string | null> = [null, "private", "internal", "external", "public"];
const mutabilityPrecedence: Array<string | null> = [null, "payable", "view", "pure"];

/**
 * Build a combined view of all of a contracts functions, both those
 * directly implemented and those (abstract + impl) in the inheritance graph.
 */
export function resolveAllContractFunctions(
  contractNode: ContractInfo,
  linearizationCtx: LinearizationContext
): FunctionRecord[] {
  const ancestorContracts = findAncestorContractsFor(
    contractNode,
    linearizationCtx
  );

  return ancestorContracts.reverse().reduce(overrideFunctionsWith, []);
}

function overrideFunctionsWith(
  combinedFunctionRecords: FunctionRecord[],
  contractNode: ContractInfo
) {
  const contractId = toContractId(contractNode);
  const functions = contractNode.functions;
  const additional: FunctionRecord[] = [];

  for (const fn of functions) {
    const existingFnRecord = combinedFunctionRecords.find((ef) =>
      isSameFunction(ef.definition, fn)
    );

    if (!existingFnRecord) {
      // Clone to avoid modifying the original
      additional.push({
        definition: { ...fn },
        implementedIn: [contractId],
      });
    } else {
      widenFunctionDefinition(existingFnRecord.definition, fn);
      existingFnRecord.implementedIn.push(contractId);
    }
  }

  return combinedFunctionRecords.concat(additional);
}

function findAncestorContractsFor(
  contractNode: ContractInfo,
  { linearizations, contracts }: LinearizationContext
): ContractInfo[] {
  return (linearizations[toContractId(contractNode)] ?? [])
    .map((contractId: string) => contracts[contractId])
    .filter(Boolean);
}

/**
 * Compare two functions by name and parameter types.
 * Uses normalized type text comparison (from CST unparse).
 */
function isSameFunction(left: FunctionInfo, right: FunctionInfo): boolean {
  return (
    left.name === right.name &&
    left.paramTypeTexts.length === right.paramTypeTexts.length &&
    left.paramTypeTexts.every((t, i) => t === right.paramTypeTexts[i])
  );
}

/**
 * If the overriding function widens the function's signature constraints
 * (e.g. public over external) then reflect this on the existing function.
 */
function widenFunctionDefinition(
  existing: FunctionInfo,
  next: FunctionInfo
): void {
  existing.mutability = widenMutability(existing.mutability, next.mutability);
  existing.visibility = widenVisibility(existing.visibility, next.visibility);

  if (next.hasBody) {
    existing.hasBody = true;
  }

  // Update signature text and returns text to match widened version
  // We rebuild from the existing definition since visibility/mutability may change
  if (next.returnsText !== null && existing.returnsText === null) {
    existing.returnsText = next.returnsText;
  }
}

function widenMutability(
  left: string | null,
  right: string | null
): string | null {
  const leftIndex = mutabilityPrecedence.indexOf(left);
  const rightIndex = mutabilityPrecedence.indexOf(right);
  return leftIndex >= rightIndex ? left : right;
}

function widenVisibility(
  left: string | null,
  right: string | null
): string | null {
  const leftIndex = visibilityPrecedence.indexOf(left);
  const rightIndex = visibilityPrecedence.indexOf(right);
  return leftIndex >= rightIndex ? left : right;
}
