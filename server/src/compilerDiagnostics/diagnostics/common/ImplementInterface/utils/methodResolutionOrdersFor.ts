import { linearize } from "c3-linearization";
import {
  ContractInfo,
  ContractIdToInfoMapping,
  InheritanceLookupTable,
  LinearizationContext,
} from "../types";
import { toContractId } from "./toContractId";

export function methodResoltionOrdersFor(
  contractNode: ContractInfo
): LinearizationContext {
  const { lookupTable, contractIdToInfoMapping } =
    convertContractToLookups(contractNode);

  const linearizations = linearize(lookupTable, {
    reverse: true,
  });

  return {
    linearizations,
    contracts: contractIdToInfoMapping,
  };
}

function convertContractToLookups(contractNode: ContractInfo) {
  const lookupTable: InheritanceLookupTable = {};
  const contractIdToInfoMapping: ContractIdToInfoMapping = {};

  recursivelyAppendInheritanceInfo(
    contractNode,
    lookupTable,
    contractIdToInfoMapping
  );

  return { lookupTable, contractIdToInfoMapping };
}

function recursivelyAppendInheritanceInfo(
  node: ContractInfo,
  lookupTable: InheritanceLookupTable,
  contractIdToInfoMapping: ContractIdToInfoMapping
) {
  for (const parent of node.parents) {
    recursivelyAppendInheritanceInfo(
      parent,
      lookupTable,
      contractIdToInfoMapping
    );
  }

  const contractId = toContractId(node);
  contractIdToInfoMapping[contractId] = node;
  lookupTable[contractId] = node.parents.map(toContractId);
}
