import { ContractDefinitionNode, UserDefinedTypeName } from "@common/types";
import { FunctionRecord, LinearizationContext } from "../types";
import { toContractId } from "./toContractId";

export function resolveImplementationOverrides(
  functionRecord: FunctionRecord,
  isAbstract: boolean,
  contractNode: ContractDefinitionNode,
  linearizationCtx: LinearizationContext
): UserDefinedTypeName[] {
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
  contractNode: ContractDefinitionNode,
  linearizationCtx: LinearizationContext
) {
  const overridingContractIds = contractNode.inheritanceNodes.map(
    (inheritanceNode) =>
      findMostDerivedContractImplementedIn(
        inheritanceNode,
        functionRecord,
        linearizationCtx
      )
  );

  return new Set<string>(
    overridingContractIds.filter(
      (contractId): contractId is string => contractNode !== undefined
    )
  );
}

function findMostDerivedContractImplementedIn(
  contractNode: ContractDefinitionNode,
  { implementedIn }: FunctionRecord,
  { linearizations }: LinearizationContext
): string | undefined {
  const contractId = toContractId(contractNode);

  return linearizations[contractId].find((contractId) =>
    implementedIn.includes(contractId)
  );
}

/**
 * If a function definition is not abstract (it has a body),
 * it may still need overriden if there are multiple clashing
 * overrides for the function, however ancestor contract/interfaces
 * that are already satisfied by the implementation don't count
 * to the override total. So we filter them out here by
 * checking if more derived classes already implement the less
 * derived classes and removing them from the override list.
 * @param overridingContractIds the contracts this function exists in
 * @param contractNode the base contract we are filling in functions for
 * @param linearizationCtx the linearization info for all contracts in the inheritance hierarchy
 * @returns the overrides as contract ids with already satisfied contracts removed.
 */
function filterAlreadySatisfiedAncestors(
  overridingContractIds: Set<string>,
  contractNode: ContractDefinitionNode,
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
): UserDefinedTypeName[] {
  const contractNames = contractIds
    .map((contractId) => contracts[contractId])
    .filter(
      (contract): contract is ContractDefinitionNode => contract !== undefined
    )
    .map((contract) => contract.astNode.name);

  return contractNames
    .sort((left, right) => left.localeCompare(right))
    .map((contractName) => ({
      type: "UserDefinedTypeName",
      namePath: contractName,
    }));
}
