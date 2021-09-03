"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkIfPositionInNodeContractDefinition = exports.findSourceUnitNode = exports.isNodeConnectable = exports.isPositionShadowedByNode = exports.isNodeShadowedByNode = exports.isNodePosition = exports.getRange = exports.getParserPositionFromVSCodePosition = exports.findNodeModules = void 0;
const fs = require("fs");
const path = require("path");
const types_1 = require("@common/types");
function findNodeModules(fromURI, rootPath) {
    let nodeModulesPath = path.join(fromURI, "..", "node_modules");
    while (rootPath && nodeModulesPath.includes(rootPath) && !fs.existsSync(nodeModulesPath)) {
        nodeModulesPath = path.join(nodeModulesPath, "..", "..", "node_modules");
    }
    if (fs.existsSync(nodeModulesPath)) {
        return nodeModulesPath;
    }
    return undefined;
}
exports.findNodeModules = findNodeModules;
function getParserPositionFromVSCodePosition(position) {
    return {
        // TO-DO: Remove +1 when "@solidity-parser" fix line counting.
        // Why +1? Because "vs-code" line counting from 0, and "@solidity-parser" from 1.
        line: position.line + 1,
        column: position.character
    };
}
exports.getParserPositionFromVSCodePosition = getParserPositionFromVSCodePosition;
function getRange(loc) {
    // TO-DO: Remove -1 when "@solidity-parser" fix line counting.
    // Why -1? Because "vs-code" line counting from 0, and "@solidity-parser" from 1.
    return types_1.Range.create(types_1.VSCodePosition.create(loc.start.line - 1, loc.start.column), types_1.VSCodePosition.create(loc.end.line - 1, loc.end.column));
}
exports.getRange = getRange;
/**
 * Checks if the forwarded position is equal to the position of the forwarded Node.
 *
 * @returns true if the positions are equal, otherwise false.
 */
function isNodePosition(node, position) {
    if (node.nameLoc &&
        node.nameLoc.start.line === position.line &&
        node.nameLoc.end.line === position.line &&
        node.nameLoc.start.column <= position.column &&
        node.nameLoc.end.column >= position.column) {
        return true;
    }
    return false;
}
exports.isNodePosition = isNodePosition;
/**
 * Checks if the child's range is within the parent range.
 *
 * @returns true if the child is shadowed by a parent, otherwise false.
 */
function isNodeShadowedByNode(child, parent) {
    if (child && parent &&
        parent.astNode.range && child.astNode.range &&
        parent.astNode.range[0] <= child.astNode.range[0] &&
        parent.astNode.range[1] >= child.astNode.range[1]) {
        return true;
    }
    return false;
}
exports.isNodeShadowedByNode = isNodeShadowedByNode;
/**
 * Checks if the position is within the node position.
 *
 * @returns true if the position is shadowed by node, otherwise false.
 */
function isPositionShadowedByNode(position, node) {
    if (position && (node === null || node === void 0 ? void 0 : node.astNode.loc) &&
        ((node.astNode.loc.start.line < position.line &&
            node.astNode.loc.end.line > position.line) || (node.astNode.loc.start.line === position.line &&
            node.astNode.loc.end.line === position.line &&
            node.astNode.loc.start.column <= position.column &&
            node.astNode.loc.end.column >= position.column))) {
        return true;
    }
    return false;
}
exports.isPositionShadowedByNode = isPositionShadowedByNode;
/**
 * Checks if the child can connect with the parent.
 *
 * @returns true if the child is connectable to parent, otherwise false.
 */
function isNodeConnectable(parent, child) {
    var _a;
    if (parent && child &&
        parent.isAlive && child.isAlive &&
        parent.getName() && child.getName() &&
        (parent.getName() === child.getName() || parent.getName() === child.getAliasName()) && (parent.connectionTypeRules.includes(child.type) ||
        parent.connectionTypeRules.includes(((_a = child.getExpressionNode()) === null || _a === void 0 ? void 0 : _a.type) || ""))) {
        return true;
    }
    return false;
}
exports.isNodeConnectable = isNodeConnectable;
/**
 * @param node From which Node do we start searching.
 * @returns SourceUnitNode if exist.
 */
function findSourceUnitNode(node) {
    let rootNode = node;
    while (rootNode && rootNode.type !== "SourceUnit") {
        rootNode = rootNode.getParent();
    }
    if ((rootNode === null || rootNode === void 0 ? void 0 : rootNode.type) === "SourceUnit") {
        return rootNode;
    }
    return undefined;
}
exports.findSourceUnitNode = findSourceUnitNode;
/**
 * Checks that the forwarded URI is the same as the ContractDefinitionNode URI and
 * that the forwarded position shadowed by the forwarded ContractDefinitionNode location.
 *
 * @param uri The path to the file of position. Uri needs to be decoded and without the "file://" prefix.
 * @param position Cursor position in file.
 * @param node From which node we will try go to ContractDefinitionNode.
 * @returns true if position in node contractDefinition, otherwise false.
 */
function checkIfPositionInNodeContractDefinition(uri, position, node) {
    while (node && node.type !== "ContractDefinition") {
        node = node.getParent();
    }
    if ((node === null || node === void 0 ? void 0 : node.type) === "ContractDefinition" && uri === node.uri && isPositionShadowedByNode(position, node)) {
        return true;
    }
    return false;
}
exports.checkIfPositionInNodeContractDefinition = checkIfPositionInNodeContractDefinition;
//# sourceMappingURL=index.js.map