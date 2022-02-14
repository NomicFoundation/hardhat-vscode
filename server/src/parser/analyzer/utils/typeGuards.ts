import {
  ASTNode,
  ContractDefinition,
  FunctionDefinition,
  FunctionCall,
  ImportDirectiveNode,
  Node,
} from "@common/types";
import { ContractDefinitionNode } from "../nodes/ContractDefinitionNode";
import { FunctionDefinitionNode } from "../nodes/FunctionDefinitionNode";
import { MemberAccessNode } from "../nodes/MemberAccessNode";
import { FunctionCallNode } from "../nodes/FunctionCallNode";

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

export function isFunctionDefinition(
  node: ASTNode
): node is FunctionDefinition {
  return node.type === "FunctionDefinition";
}

export function isFunctionDefinitionNode(
  node: Node
): node is FunctionDefinitionNode {
  return node.type === "FunctionDefinition";
}

export function isFunctionCall(node: ASTNode): node is FunctionCall {
  return node.type === "FunctionCall";
}

export function isFunctionCallNode(node: Node): node is FunctionCallNode {
  return node.type === "FunctionCall";
}

export function isMemberAccessNode(node: Node): node is MemberAccessNode {
  return node.type === "MemberAccess";
}

export function isImportDirectiveNode(node: Node): node is ImportDirectiveNode {
  return node.type === "ImportDirective";
}
