import { Node } from "@common/types";
import { ContractDefinitionNode } from "../nodes/ContractDefinitionNode";
import { FunctionDefinitionNode } from "../nodes/FunctionDefinitionNode";

export function isContractDefinition(
  node: Node
): node is ContractDefinitionNode {
  return node.type === "ContractDefinition";
}

export function isFunctionDefinition(
  node: Node
): node is FunctionDefinitionNode {
  return node.type === "FunctionDefinition";
}
