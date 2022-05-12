import * as fs from "fs";
import * as path from "path";

import {
  Position,
  Location,
  Node,
  SourceUnitNode,
  Range,
  VSCodePosition,
} from "@common/types";
import {
  isFunctionCallNode,
  isFunctionDefinitionNode,
  isMemberAccessNode,
} from "@analyzer/utils/typeGuards";

interface FindUpOptions {
  cwd?: string;
  stopAt?: string;
  fullPath?: boolean;
}

export function findUpSync(
  fileName: string,
  options?: FindUpOptions
): string | undefined {
  if (!options) {
    options = {};
  }
  options.cwd =
    options.cwd !== undefined ? path.resolve(options.cwd) : process.cwd();
  options.stopAt =
    options.stopAt !== undefined
      ? path.resolve(options.stopAt)
      : path.parse(process.cwd()).root;

  if (!options.cwd.includes(options.stopAt)) {
    return undefined;
  }

  let directory = options.cwd;
  while (!fs.existsSync(path.resolve(directory, fileName))) {
    if (directory === options.stopAt) {
      return undefined;
    }

    directory = path.resolve(directory, "..");
  }

  if (options.fullPath !== undefined) {
    return path.join(directory, fileName);
  }

  return directory;
}

export function getParserPositionFromVSCodePosition(
  position: VSCodePosition
): Position {
  return {
    // TO-DO: Remove +1 when "@solidity-parser" fix line counting.
    // Why +1? Because "vs-code" line counting from 0, and "@solidity-parser" from 1.
    line: position.line + 1,
    column: position.character,
  };
}

export function getRange(loc: Location): Range {
  // TO-DO: Remove -1 when "@solidity-parser" fix line counting.
  // Why -1? Because "vs-code" line counting from 0, and "@solidity-parser" from 1.
  return Range.create(
    VSCodePosition.create(loc.start.line - 1, loc.start.column),
    VSCodePosition.create(loc.end.line - 1, loc.end.column)
  );
}

/**
 * Checks if the forwarded position is equal to the position of the forwarded Node.
 *
 * @returns true if the positions are equal, otherwise false.
 */
export function isNodePosition(node: Node, position: Position): boolean {
  if (
    node.nameLoc &&
    node.nameLoc.start.line === position.line &&
    node.nameLoc.end.line === position.line &&
    node.nameLoc.start.column <= position.column &&
    node.nameLoc.end.column >= position.column
  ) {
    return true;
  }

  return false;
}

/**
 * Checks if the child's range is within the parent range.
 *
 * @returns true if the child is shadowed by a parent, otherwise false.
 */
export function isNodeShadowedByNode(
  child: Node | undefined,
  parent: Node | undefined
): boolean {
  if (
    child &&
    parent &&
    parent.astNode.range &&
    child.astNode.range &&
    parent.astNode.range[0] <= child.astNode.range[0] &&
    parent.astNode.range[1] >= child.astNode.range[1]
  ) {
    return true;
  }

  return false;
}

/**
 * Checks if the position is within the node position.
 *
 * @returns true if the position is shadowed by node, otherwise false.
 */
export function isPositionShadowedByNode(
  position: Position,
  node: Node | undefined
): boolean {
  if (
    node?.astNode.loc &&
    ((node.astNode.loc.start.line < position.line &&
      node.astNode.loc.end.line > position.line) ||
      (node.astNode.loc.start.line === position.line &&
        node.astNode.loc.end.line === position.line &&
        node.astNode.loc.start.column <= position.column &&
        node.astNode.loc.end.column >= position.column))
  ) {
    return true;
  }

  return false;
}

/**
 * Checks if the child can connect with the parent.
 *
 * @returns true if the child is connectable to parent, otherwise false.
 */
export function isNodeConnectable(
  parent: Node | undefined,
  child: Node | undefined
): boolean {
  if (!parent || !child || !parent.isAlive || !child.isAlive) {
    return false;
  }

  const parentName = parent.getName();
  const childName = child.getName();
  const childAlias = child.getAliasName();

  if (parentName === undefined || childName === undefined) {
    return false;
  }

  if (parentName !== childName && parentName !== childAlias) {
    return false;
  }

  if (
    !parent.connectionTypeRules.includes(child.type) &&
    !parent.connectionTypeRules.includes(child.getExpressionNode()?.type ?? "")
  ) {
    return false;
  }

  if (
    isFunctionDefinitionNode(parent) &&
    isMemberAccessNode(child) &&
    child.expressionNode &&
    isFunctionCallNode(child.expressionNode)
  ) {
    if (
      parent.astNode.parameters.length !==
      child.expressionNode.astNode.arguments.length
    ) {
      return false;
    }

    // TODO: check types of parameters against types of arguments
    return true;
  }

  return true;
}

/**
 * @param node From which Node do we start searching.
 * @returns SourceUnitNode if exist.
 */
export function findSourceUnitNode(
  node: Node | undefined
): SourceUnitNode | undefined {
  let rootNode = node;
  while (rootNode && rootNode.type !== "SourceUnit") {
    rootNode = rootNode.getParent();
  }

  if (rootNode?.type === "SourceUnit") {
    return rootNode as SourceUnitNode;
  }

  return undefined;
}

/**
 * Checks that the forwarded URI is the same as the ContractDefinitionNode URI and
 * that the forwarded position shadowed by the forwarded ContractDefinitionNode location.
 *
 * @param uri The path to the file of position. Uri needs to be decoded and without the "file://" prefix.
 * @param position Cursor position in file.
 * @param node From which node we will try go to ContractDefinitionNode.
 * @returns true if position in node contractDefinition, otherwise false.
 */
export function checkIfPositionInNodeContractDefinition(
  uri: string,
  position: Position,
  node: Node | undefined
): boolean {
  while (node && node.type !== "ContractDefinition") {
    node = node.getParent();
  }

  if (
    node?.type === "ContractDefinition" &&
    uri === node.uri &&
    isPositionShadowedByNode(position, node)
  ) {
    return true;
  }

  return false;
}
