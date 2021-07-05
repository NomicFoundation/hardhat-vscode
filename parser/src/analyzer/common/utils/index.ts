import * as fs from "fs";
import * as path from "path";

import { Position, Node, SourceUnitNode } from "@common/types";

export function findNodeModules(fromURI: string, rootPath: string): string | undefined {
    let nodeModulesPath = path.join(fromURI, "..", "node_modules");

    while (rootPath && nodeModulesPath.includes(rootPath) && !fs.existsSync(nodeModulesPath)) {
        nodeModulesPath = path.join(nodeModulesPath, "..", "..", "node_modules");
    }

    if (fs.existsSync(nodeModulesPath)) {
        return nodeModulesPath;
    }

    return undefined;
}

export function decodeUriAndRemoveFilePrefix(uri: string): string {
    if (uri && uri.includes('file://')) {
        uri = uri.replace("file://", "");
    }

    if (uri) {
        uri = decodeURIComponent(uri);
    }

    return uri;
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
export function isNodeShadowedByNode(child: Node | undefined, parent: Node | undefined): boolean {
    if (
        child && parent &&
        parent.astNode.range && child.astNode.range &&
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
 export function isPositionShadowedByNode(position: Position, node: Node | undefined): boolean {
    if (
        position && node?.astNode.loc &&
        ((
            node.astNode.loc.start.line < position.line &&
            node.astNode.loc.end.line > position.line
        ) || (
            node.astNode.loc.start.line === position.line &&
            node.astNode.loc.end.line === position.line &&
            node.astNode.loc.start.column <= position.column &&
            node.astNode.loc.end.column >= position.column
        ))
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
export function isNodeConnectable(parent: Node | undefined, child: Node | undefined): boolean {
    if (
        parent && child &&
        parent.getName() && child.getName() &&
        (parent.getName() === child.getName() || parent.getName() === child.getAliasName()) && (
            parent.connectionTypeRules.includes(child.type) ||
            parent.connectionTypeRules.includes(child.getExpressionNode()?.type || "")
    )) {
        return true;
    }

    return false;
}

/**
 * @param node From which Node do we start searching.
 * @returns SourceUnitNode if exist.
 */
export function findSourceUnitNode(node: Node | undefined): SourceUnitNode | undefined {
    let rootNode = node;
    while (rootNode && rootNode.type !== "SourceUnit") {
        rootNode = rootNode.getParent();
    }

    if (rootNode?.type === "SourceUnit") {
        return (rootNode as SourceUnitNode);
    }

    return undefined;
}

/**
 * Checks that the forwarded URI is the same as the ContractDefinitionNode URI and 
 * that the forwarded position shadowed by the forwarded ContractDefinitionNode location.
 * 
 * @param uri The path to the file of position.
 * @param position Cursor position in file.
 * @param node From which node we will try go to ContractDefinitionNode.
 * @returns true if position in node contractDefinition, otherwise false.
 */
export function checkIfPositionInNodeContractDefinition(uri: string, position: Position, node: Node | undefined): boolean {
    while (node && node.type !== "ContractDefinition") {
        node = node.getParent();
    }

    if (node?.type === "ContractDefinition" && uri === node.uri && isPositionShadowedByNode(position, node)) {
        return true;
    }

    return false;
}
