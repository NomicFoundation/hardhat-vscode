import { linearize } from "c3-linearization";
import { ContractDefinitionNode } from "@common/types";
import {
  ContractIdToNodeMapping,
  InheritanceLookupTable,
  LinearizationContext,
} from "../types";
import { toContractId } from "./toContractId";

export function methodResoltionOrdersFor(
  contractNode: ContractDefinitionNode
): LinearizationContext {
  const { lookupTable, contractIdToNodeMapping } =
    convertContractAstToLookups(contractNode);

  const linearizations = linearize(lookupTable, {
    reverse: true,
  });

  return {
    linearizations,
    contracts: contractIdToNodeMapping,
  };
}

function convertContractAstToLookups(contractNode: ContractDefinitionNode) {
  const lookupTable: InheritanceLookupTable = {};
  const contractIdToNodeMapping: ContractIdToNodeMapping = {};

  recursivelyAppendInheritanceInfo(
    contractNode,
    lookupTable,
    contractIdToNodeMapping
  );

  return { lookupTable, contractIdToNodeMapping };
}

function recursivelyAppendInheritanceInfo(
  node: ContractDefinitionNode,
  lookupTable: InheritanceLookupTable,
  contractIdToNodeMapping: ContractIdToNodeMapping
) {
  for (const inheritanceNode of node.inheritanceNodes) {
    recursivelyAppendInheritanceInfo(
      inheritanceNode,
      lookupTable,
      contractIdToNodeMapping
    );
  }

  const contractId = toContractId(node);
  contractIdToNodeMapping[contractId] = node;
  lookupTable[contractId] = node.inheritanceNodes.map(toContractId);
}
