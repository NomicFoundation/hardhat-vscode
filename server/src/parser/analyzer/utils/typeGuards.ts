import {
  ASTNode,
  ContractDefinition,
  FunctionDefinition,
  FunctionCall,
  ImportDirectiveNode,
  Node,
  IdentifierNode,
  VariableDeclarationNode,
  Mapping,
  EmptyNodeType,
} from "@common/types";
import {
  ArrayTypeName,
  BaseASTNode,
  CustomErrorDefinition,
  ElementaryTypeName,
  EventDefinition,
  UserDefinedTypeName,
  VariableDeclaration,
} from "@solidity-parser/parser/dist/src/ast-types";
import { ElementaryTypeNameNode } from "@analyzer/nodes/ElementaryTypeNameNode";
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
  node: BaseASTNode | EmptyNodeType
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

export function isIdentifierNode(node: Node): node is IdentifierNode {
  return node.type === "Identifier";
}

export function isVariableDeclarationNode(
  node: Node
): node is VariableDeclarationNode {
  return node.type === "VariableDeclaration";
}

export function isVariableDeclaration(
  node: BaseASTNode | EmptyNodeType
): node is VariableDeclaration {
  return node.type === "VariableDeclaration";
}

export function isEventDefinition(
  node: BaseASTNode | EmptyNodeType
): node is EventDefinition {
  return node.type === "EventDefinition";
}

export function isCustomErrorDefinition(
  node: BaseASTNode | EmptyNodeType
): node is CustomErrorDefinition {
  return node.type === "CustomErrorDefinition";
}

export function isMapping(
  node: ASTNode | BaseASTNode | EmptyNodeType
): node is Mapping {
  return node.type === "Mapping";
}

export function isElementaryTypeNameNode(
  node: Node
): node is ElementaryTypeNameNode {
  return node.type === "ElementaryTypeName";
}

export function isElementaryTypeName(
  node: BaseASTNode | EmptyNodeType
): node is ElementaryTypeName {
  return node.type === "ElementaryTypeName";
}

export function isUserDefinedTypeName(
  node: BaseASTNode | EmptyNodeType
): node is UserDefinedTypeName {
  return node.type === "UserDefinedTypeName";
}

export function isArrayTypeName(
  node: BaseASTNode | EmptyNodeType
): node is ArrayTypeName {
  return node.type === "ArrayTypeName";
}
