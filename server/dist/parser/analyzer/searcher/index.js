"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Searcher = void 0;
const utils = require("@common/utils");
const types_1 = require("@common/types");
class Searcher {
    constructor(analyzerTree) {
        this.analyzerTree = analyzerTree;
    }
    /**
     * Searches for a parent definition for the forwarded Node.
     *
     * @param node Node for wich we are looking for a parent.
     * @param from From which Node do we start searching for the parent.
     * @param searchInInheritanceNodes If it is true, we will look for the parent in the inheritance nodes as well. Default is false.
     * @returns Parent Node if it exists, otherwise returns undefined.
     */
    findParent(node, from, searchInInheritanceNodes = false) {
        let parent;
        // If from doesn't exist start finding from the root of the analyzerTree.
        if (!from) {
            parent = this.search(node, this.analyzerTree.tree, searchInInheritanceNodes);
        }
        else {
            parent = this.search(node, from, searchInInheritanceNodes);
        }
        if (parent) {
            // If the parent Node has an alias, then we must set the alias on the Node to which it is the parent.
            // For parent with an alias, we have to set an alias to all his children Nodes
            // if we want them to be listed when find all references called.
            node.setAliasName(parent.getAliasName());
            // If parent exists always return definition Node.
            parent = parent.getDefinitionNode();
        }
        // If the parent uri and node uri are not the same, add the node to the exportNode field.
        // And for every exportNode we need to add them to the importNodes field so
        // we can later refresh all exportNodes without analyzing all the files in our project.
        if (parent && parent.uri !== node.uri) {
            const exportRootNode = utils.findSourceUnitNode(parent);
            const importRootNode = utils.findSourceUnitNode(this.analyzerTree.tree);
            if (exportRootNode) {
                exportRootNode.addExportNode(node);
            }
            if (importRootNode) {
                importRootNode.addImportNode(node);
            }
        }
        return parent;
    }
    /**
     * @param uri Path to the file. Uri needs to be decoded and without the "file://" prefix.
     * @param position Position in the file.
     * @param from From which Node do we start searching.
     * @returns Founded definition node.
     */
    findDefinitionNodeByPosition(uri, position, from) {
        return this._findNodeByPosition(uri, position, from, true, false);
    }
    /**
     * @param uri Path to the file. Uri needs to be decoded and without the "file://" prefix.
     * @param position Position in the file.
     * @param from From which Node do we start searching.
     * @param searchInExpression If it is true, we will also look at the expressionNode for Node
     * otherwise, we won't. Default is false.
     * @returns Founded definition node.
     */
    findNodeByPosition(uri, position, from, searchInExpression) {
        return this._findNodeByPosition(uri, position, from, false, searchInExpression);
    }
    /**
     * Searches children for definitionNode and if any exist adds them to the
     * children definitionNode list and sets their parent to definitionNode.
     *
     * @param definitionNode A node that calls this function and which will be the parent Node of the found children.
     * @param orphanNodes Place where we search for children.
     * @param isShadowed If this is true, make sure the child is in the shadow of definitionNode. Default is true.
     */
    findAndAddChildren(definitionNode, orphanNodes, isShadowed = true) {
        const newOrphanNodes = [];
        let orphanNode = orphanNodes.shift();
        while (orphanNode) {
            if ((!isShadowed ||
                (isShadowed && utils.isNodeShadowedByNode(orphanNode, definitionNode))) &&
                utils.isNodeConnectable(definitionNode, orphanNode)) {
                orphanNode.addTypeNode(definitionNode);
                orphanNode.setParent(definitionNode);
                definitionNode.addChild(orphanNode);
            }
            else {
                newOrphanNodes.push(orphanNode);
            }
            orphanNode = orphanNodes.shift();
        }
        // Return to orphanNodes array unhandled orphan nodes
        for (const newOrphanNode of newOrphanNodes) {
            orphanNodes.push(newOrphanNode);
        }
    }
    /**
     * Searches children for definitionNode and if any exist adds them to the
     * children definitionNode list and sets their parent to definitionNode.
     *
     * @param definitionNode A node that calls this function and which will be the parent Node of the found children.
     * @param exportNodes Place where we search for children.
     */
    findAndAddExportChildren(definitionNode, exportNodes) {
        var _a, _b;
        const newOrphanNodes = [];
        let exportNode = exportNodes.shift();
        while (exportNode) {
            const exportDefinitionNode = exportNode.getDefinitionNode();
            if (((_a = exportDefinitionNode === null || exportDefinitionNode === void 0 ? void 0 : exportDefinitionNode.parent) === null || _a === void 0 ? void 0 : _a.getName()) === ((_b = definitionNode.parent) === null || _b === void 0 ? void 0 : _b.getName()) &&
                utils.isNodeConnectable(definitionNode, exportNode)) {
                exportNode.addTypeNode(definitionNode);
                exportNode.setParent(definitionNode);
                definitionNode.addChild(exportNode);
            }
            else {
                newOrphanNodes.push(exportNode);
            }
            exportNode = exportNodes.shift();
        }
        // Return to orphanNodes array unhandled orphan nodes
        for (const newOrphanNode of newOrphanNodes) {
            exportNodes.push(newOrphanNode);
        }
    }
    /**
     * Searches for all definitionNodes in forwarded from Node and in its imports.
     *
     * @param uri File where is cursor now. Uri needs to be decoded and without the "file://" prefix.
     * @param position Cursor position in file.
     * @param from From which Node do we start searching.
     * @returns Definition Nodes.
     */
    findDefinitionNodes(uri, position, from) {
        const definitionNodes = [];
        this._findDefinitionNodes(uri, position, from, definitionNodes);
        return definitionNodes;
    }
    /**
     * @param uri The path to the file. Uri needs to be decoded and without the "file://" prefix.
     * @param position Cursor position in file.
     * @param node That we will try to add in definitionNodes.
     * @param isShadowedByParent Is current from node shadowed by position.
     *
     * @returns If the node is visible, we will return true, otherwise it will be false.
     */
    checkIsNodeVisible(uri, position, node) {
        const visibility = this.getNodeVisibility(node);
        if (!visibility || (visibility && ["default", "public"].includes(visibility))) {
            return true;
        }
        else if (["internal", "private"].includes(visibility) &&
            utils.checkIfPositionInNodeContractDefinition(uri, position, node)) {
            return true;
        }
        else if (visibility === "external" &&
            !utils.checkIfPositionInNodeContractDefinition(uri, position, node)) {
            return true;
        }
        return false;
    }
    /**
     * @returns Node visibility type.
     */
    getNodeVisibility(node) {
        if (node.type === "FunctionDefinition") {
            return node.getVisibility();
        }
        else if (node.type === "VariableDeclaration") {
            return node.getVisibility();
        }
        return undefined;
    }
    /**
     * @param uri Path to the file. Uri needs to be decoded and without the "file://" prefix.
     * @param position Position in the file.
     * @param from From which Node do we start searching.
     * @param returnDefinitionNode If it is true, we will return the definition Node of found Node,
     * otherwise we will return found Node. Default is true.
     * @param searchInExpression If it is true, we will also look at the expressionNode for Node
     * otherwise, we won't. Default is false.
     * @returns Founded Node.
     */
    _findNodeByPosition(uri, position, from, returnDefinitionNode = true, searchInExpression = false) {
        const node = this.walk(uri, position, from || this.analyzerTree.tree, searchInExpression);
        if (node && returnDefinitionNode) {
            return node.getDefinitionNode();
        }
        return node;
    }
    /**
     * This function looking for a Node that can be connected to the forwarded node.
     *
     * @param node For which we are trying to find a node that can be connected.
     * @param from From which Node do we start searching.
     * @param searchInInheritanceNodes If it is true, we will look for the parent in the inheritance nodes as well.
     * @returns Node that can connect to the forwarded node.
     */
    search(node, from, searchInInheritanceNodes, visitedNodes, visitedFiles) {
        if (!visitedNodes) {
            visitedNodes = [];
        }
        if (!visitedFiles) {
            visitedFiles = [];
        }
        if (!from) {
            return undefined;
        }
        if (visitedNodes.includes(from)) {
            return undefined;
        }
        // Add as visited node
        visitedNodes.push(from);
        let parent;
        if (utils.isNodeConnectable(from, node)) {
            return from;
        }
        for (const child of from.children) {
            // Don't check if the Node is in the shadow of the Node for AssemblyFor and ImportDirective Nodes
            // because we have to get into them and check if Node is shadowed for their children
            if (from.type !== "AssemblyFor" && child.type !== "ImportDirective" && !utils.isNodeShadowedByNode(node, child)) {
                if (utils.isNodeConnectable(child, node)) {
                    return child;
                }
                continue;
            }
            parent = this.search(node, child, searchInInheritanceNodes, visitedNodes);
            if (parent) {
                return parent;
            }
        }
        // Handle inheritance
        if (searchInInheritanceNodes && from.type === "ContractDefinition") {
            const inheritanceNodes = from.getInheritanceNodes();
            for (let i = inheritanceNodes.length - 1; i >= 0; i--) {
                const inheritanceNode = inheritanceNodes[i];
                if (utils.isNodeConnectable(inheritanceNode, node)) {
                    return inheritanceNode;
                }
                parent = this.search(node, inheritanceNode, searchInInheritanceNodes, visitedNodes);
                if (parent) {
                    return parent;
                }
            }
        }
        // Handle import
        const matched = this.searchInImportNodes(visitedFiles, node, from);
        if (matched) {
            return matched;
        }
        return this.search(node, from.parent, searchInInheritanceNodes, visitedNodes);
    }
    /**
     * This function looking in imported files for a Node that can be connected to the forwarded node.
     * This means that we will not check if the Node is shaded because it is in another file.
     *
     * @param visitedFiles This will be an array of URIs.
     * We need this to stop infinite recursion if someone implements circular dependency.
     * @param node For which we are trying to find a node that can be connected.
     * @param from From which Node do we start searching.
     * @returns Node that can connect to the forwarded node.
     */
    searchInImportNodes(visitedFiles, node, from) {
        var _a;
        if (!from) {
            return undefined;
        }
        if (from.type === "ImportDirective") {
            const importPath = from.getImportPath();
            const importAliasNodes = from.getAliasNodes();
            let importNode;
            if (importPath) {
                importNode = (_a = from.documentsAnalyzer[importPath]) === null || _a === void 0 ? void 0 : _a.analyzerTree.tree;
            }
            if (importNode && !visitedFiles.includes(importNode.uri)) {
                // Add as visited file
                visitedFiles.push(importNode.uri);
                if (importAliasNodes.length > 0) {
                    for (const importAliasNode of importAliasNodes) {
                        if (importAliasNode && node &&
                            importAliasNode.isAlive && node.isAlive &&
                            importAliasNode.getName() && node.getName() &&
                            importAliasNode.getName() === node.getName()) {
                            return importAliasNode;
                        }
                    }
                }
                else {
                    for (const child of (importNode === null || importNode === void 0 ? void 0 : importNode.children) || []) {
                        const matched = this.searchInImportNodes(visitedFiles, node, child);
                        if (matched) {
                            return matched;
                        }
                        if (utils.isNodeConnectable(child, node)) {
                            return child;
                        }
                    }
                }
            }
        }
    }
    /**
     * We search Node in expression, we have to search in an expression node,
     * because expression nodes, such as MemberAccess, aren't in orphanNodes.
     *
     * @param uri The path to the {@link Node} file. Uri needs to be decoded and without the "file://" prefix.
     * @param position {@link Node} position in file.
     * @returns Wanted {@link Node} if exist.
     */
    searchInExpressionNode(uri, position, expressionNode) {
        if (!expressionNode) {
            return undefined;
        }
        if (utils.isNodePosition(expressionNode, position) &&
            (expressionNode.uri === uri ||
                (expressionNode.type === "ImportDirective" && expressionNode.realUri === uri))) {
            return expressionNode;
        }
        const matched = this.searchInExpressionNode(uri, position, expressionNode.getExpressionNode());
        if (matched) {
            return matched;
        }
    }
    /**
     * Walk through the analyzedTree and try to find Node with forwarded {@link Node.uri uri} and {@link Node.nameLoc position}.
     *
     * @param uri The path to the {@link Node} file. Uri needs to be decoded and without the "file://" prefix.
     * @param position {@link Node} position in file.
     * @param from From which Node do we start searching.
     * @param searchInExpression Default is false. Set true only if you try to find Nodes
     * that aren't in orphan Nodes and don't have a parent. Like MemberAccessNode without a parent.
     * @returns Wanted {@link Node} if exist.
     */
    walk(uri, position, from, searchInExpression = false, visitedNodes, visitedFiles) {
        var _a;
        if (!visitedNodes) {
            visitedNodes = [];
        }
        if (!visitedFiles) {
            visitedFiles = [];
        }
        if (!from) {
            return undefined;
        }
        if (visitedNodes.includes(from)) {
            return undefined;
        }
        // Add as visited node
        visitedNodes.push(from);
        if (utils.isNodePosition(from, position) &&
            from.isAlive &&
            (from.uri === uri ||
                (from.type === "ImportDirective" && from.realUri === uri))) {
            return from;
        }
        // Handle import
        if (from.type === "ImportDirective") {
            const importPath = from.getImportPath();
            const importAliasNodes = from.getAliasNodes();
            let importNode;
            if (importPath) {
                importNode = (_a = from.documentsAnalyzer[importPath]) === null || _a === void 0 ? void 0 : _a.analyzerTree.tree;
            }
            if (importNode && !visitedFiles.includes(importNode.uri)) {
                let parent = undefined;
                if (importAliasNodes.length > 0) {
                    for (const importAliasNode of importAliasNodes) {
                        parent = this.walk(uri, position, importAliasNode, searchInExpression, visitedNodes, visitedFiles);
                        if (parent) {
                            break;
                        }
                    }
                }
                else {
                    // Add URI in visitedFiles only when we analyze the whole file.
                    visitedFiles.push(importNode.uri);
                    parent = this.walk(uri, position, importNode, searchInExpression, visitedNodes, visitedFiles);
                }
                if (parent) {
                    return parent;
                }
            }
        }
        for (const child of from.children) {
            const parent = this.walk(uri, position, child, searchInExpression, visitedNodes, visitedFiles);
            if (parent) {
                return parent;
            }
        }
        if (searchInExpression) {
            const expressionNode = this.searchInExpressionNode(uri, position, from.getExpressionNode());
            if ((expressionNode === null || expressionNode === void 0 ? void 0 : expressionNode.type) === "MemberAccess") {
                return expressionNode.getPreviousMemberAccessNode();
            }
        }
        return this.walk(uri, position, from.parent, searchInExpression, visitedNodes, visitedFiles);
    }
    /**
     *
     * @param uri The path to the {@link Node} file. Uri needs to be decoded and without the "file://" prefix.
     * @param position Cursor position in file.
     * @param from From which Node do we start searching.
     * @param definitionNodes When the function is complete, we will find all the definition nodes here.
     * @param isShadowedByParent Is current from node shadowed by position.
     */
    _findDefinitionNodes(uri, position, from, definitionNodes, isShadowedByParent = false, visitedNodes, visitedFiles) {
        var _a, _b, _c;
        if (!visitedNodes) {
            visitedNodes = [];
        }
        if (!visitedFiles) {
            visitedFiles = [];
        }
        if (!from) {
            return;
        }
        if (visitedNodes.includes(from)) {
            return;
        }
        // Add as visited node
        visitedNodes.push(from);
        if ((isShadowedByParent ||
            utils.isPositionShadowedByNode(position, from) ||
            ((_a = from.parent) === null || _a === void 0 ? void 0 : _a.type) === "SourceUnit") && (types_1.definitionNodeTypes.includes(from.type) ||
            types_1.declarationNodeTypes.includes(from.type)) &&
            uri === from.uri) {
            isShadowedByParent = true;
            const isVisible = this.checkIsNodeVisible(uri, position, from);
            if (isVisible) {
                definitionNodes.push(from);
            }
        }
        else if (((_b = from.parent) === null || _b === void 0 ? void 0 : _b.type) === "SourceUnit" &&
            types_1.definitionNodeTypes.includes(from.type) &&
            uri !== from.uri) {
            const isVisible = this.checkIsNodeVisible(uri, position, from);
            if (isVisible) {
                definitionNodes.push(from);
            }
        }
        if (types_1.definitionNodeTypes.includes(from.type) &&
            !utils.isPositionShadowedByNode(position, from)) {
            isShadowedByParent = false;
        }
        // Handle import
        if (from.type === "ImportDirective") {
            const importPath = from.getImportPath();
            const importAliasNodes = from.getAliasNodes();
            let importNode;
            if (importPath) {
                importNode = (_c = from.documentsAnalyzer[importPath]) === null || _c === void 0 ? void 0 : _c.analyzerTree.tree;
            }
            if (importNode && !visitedFiles.includes(importNode.uri)) {
                // Add as visited file
                visitedFiles.push(importNode.uri);
                if (importAliasNodes.length > 0) {
                    for (const importAliasNode of importAliasNodes) {
                        const isVisible = this.checkIsNodeVisible(uri, position, importAliasNode);
                        if (isVisible) {
                            definitionNodes.push(importAliasNode);
                        }
                    }
                }
                else {
                    this._findDefinitionNodes(uri, position, importNode, definitionNodes, isShadowedByParent, visitedNodes, visitedFiles);
                }
            }
        }
        // Handle inheritance
        if (from.type === "ContractDefinition" &&
            utils.isPositionShadowedByNode(position, from) &&
            uri === from.uri) {
            const inheritanceNodes = from.getInheritanceNodes();
            for (let i = inheritanceNodes.length - 1; i >= 0; i--) {
                const inheritanceNode = inheritanceNodes[i];
                for (const child of inheritanceNode.children) {
                    const childVisibility = this.getNodeVisibility(child);
                    const isVisible = this.checkIsNodeVisible(uri, position, child);
                    if (isVisible || childVisibility === "internal") {
                        definitionNodes.push(child);
                    }
                }
            }
        }
        for (const child of from.children) {
            this._findDefinitionNodes(uri, position, child, definitionNodes, isShadowedByParent, visitedNodes, visitedFiles);
        }
    }
}
exports.Searcher = Searcher;
//# sourceMappingURL=index.js.map