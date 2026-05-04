import { ContractInfo, FunctionRecord, LinearizationContext } from "../types";
import { toContractId } from "./toContractId";

export interface OverrideEntry {
  type: "UserDefinedTypeName";
  namePath: string;
}

export function resolveImplementationOverrides(
  functionRecord: FunctionRecord,
  isAbstract: boolean,
  contractNode: ContractInfo,
  linearizationCtx: LinearizationContext
): OverrideEntry[] {
  const overridingContractIds = findOverridingContractIds(
    functionRecord,
    contractNode,
    linearizationCtx
  );

  const contractIds: string[] = isAbstract
    ? [...overridingContractIds]
    : filterAlreadySatisfiedAncestors(
        overridingContractIds,
        contractNode,
        linearizationCtx
      );

  const typeNames = contractIdsToTypeNames(contractIds, linearizationCtx);

  return typeNames.length === 1 ? [] : typeNames;
}

function findOverridingContractIds(
  functionRecord: FunctionRecord,
  contractNode: ContractInfo,
  linearizationCtx: LinearizationContext
) {
  const overridingContractIds = contractNode.parents.map((parent) =>
    findMostDerivedContractImplementedIn(
      parent,
      functionRecord,
      linearizationCtx
    )
  );

  return new Set<string>(
    overridingContractIds.filter(
      (contractId): contractId is string => contractId !== undefined
    )
  );
}

function findMostDerivedContractImplementedIn(
  contractNode: ContractInfo,
  { implementedIn }: FunctionRecord,
  { linearizations }: LinearizationContext
): string | undefined {
  const contractId = toContractId(contractNode);

  return linearizations[contractId].find((cid) => implementedIn.includes(cid));
}

/**
 * If a function definition is not abstract (it has a body),
 * it may still need overriden if there are multiple clashing
 * overrides for the function, however ancestor contract/interfaces
 * that are already satisfied by the implementation don't count
 * to the override total. So we filter them out here.
 */
function filterAlreadySatisfiedAncestors(
  overridingContractIds: Set<string>,
  contractNode: ContractInfo,
  { linearizations }: LinearizationContext
) {
  const linearizedImplementingContracts = (
    linearizations[toContractId(contractNode)] ?? []
  ).filter((contractId) => overridingContractIds.has(contractId));

  const seen = new Set<string>();
  const filteredContractIds = [];

  for (const implementingContract of linearizedImplementingContracts) {
    if (!seen.has(implementingContract)) {
      filteredContractIds.push(implementingContract);
    }

    const ancestors = linearizations[implementingContract] ?? [];
    ancestors.forEach((contractId) => seen.add(contractId));
  }

  return filteredContractIds;
}

function contractIdsToTypeNames(
  contractIds: string[],
  { contracts }: LinearizationContext
): OverrideEntry[] {
  const contractNames = contractIds
    .map((contractId) => contracts[contractId])
    .filter((contract): contract is ContractInfo => contract !== undefined)
    .map((contract) => contract.name);

  return contractNames
    .sort((left, right) => left.localeCompare(right))
    .map((contractName) => ({
      type: "UserDefinedTypeName" as const,
      namePath: contractName,
    }));
}
