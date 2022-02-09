import { ASTNode, ContractDefinition, Node } from "@common/types";
import { ContractDefinitionNode } from "../nodes/ContractDefinitionNode";
import { FunctionDefinitionNode } from "../nodes/FunctionDefinitionNode";

export function isContractDefinition(
  node: ASTNode
): node is ContractDefinition {
  return node.type === "ContractDefinition";
}

export function isContractDefinitionNode(
  node: Node
): node is ContractDefinitionNode {
  return node.type === "ContractDefinition";
}

export function isFunctionDefinitionNode(
  node: Node
): node is FunctionDefinitionNode {
  return node.type === "FunctionDefinition";
}
