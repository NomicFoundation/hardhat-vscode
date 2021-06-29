import * as cache from "@common/cache";
import * as utils from "@common/utils";
import {
    Position, Node, ContractDefinitionNode, ImportDirectiveNode,
    definitionNodeTypes, declarationNodeTypes, MemberAccessNode,
    FunctionDefinitionNode, VariableDeclarationNode
} from "@common/types";

/**
 * Default analyzerTree. It is variable in relation to the document we are analyzing at the time.
 */
export let analyzerTree: Node | undefined;
/**
 * @param rootNode New default {@link analyzerTree} will be rootNode.
 */
export function setRoot(rootNode: Node | undefined) {
    analyzerTree = rootNode;
}

/**
 * Searches for a parent definition for the forwarded Node.
 * 
 * @param node Node for wich we are looking for a parent.
 * @param from From which Node do we start searching for the parent.
 * @param searchInInheritanceNodes If it is true, we will look for the parent in the inheritance nodes as well. Default is false.
 * @returns Parent Node if it exists, otherwise returns undefined.
 */
export function findParent(node: Node, from?: Node, searchInInheritanceNodes = false): Node | undefined {
    let parent: Node | undefined;

    // If from doesn't exist start finding from the root of the analyzerTree.
    if (!from) {
        parent = search(node, analyzerTree, searchInInheritanceNodes);
    } else {
        parent = search(node, from, searchInInheritanceNodes);
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
        const importRootNode = utils.findSourceUnitNode(analyzerTree);

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
 * 
 * @param uri Path to the file.
 * @param position Position in the file.
 * @param from From which Node do we start searching.
 * @param returnDefinitionNode If it is true, we will return the definition Node of found Node,
 * otherwise we will return found Node. Default is true.
 * @param searchInExpression If it is true, we will also look at the expressionNode for Node
 * otherwise, we won't. Default is false.
 * @returns Found Node.
 */
export function findNodeByPosition(uri: string, position: Position, from?: Node, returnDefinitionNode = true, searchInExpression = false): Node | undefined {
    const node = walk(uri, position, from || analyzerTree, searchInExpression);

    if (node && returnDefinitionNode) {
        return node.getDefinitionNode();
    }

    return node;
}

/**
 * Searches children for definitionNode and if any exist adds them to the 
 * children definitionNode list and sets their parent to definitionNode.
 * 
 * @param definitionNode A node that calls this function and which will be the parent Node of the found children.
 * @param orphanNodes Place where we search for children.
 * @param isShadowed If this is true, make sure the child is in the shadow of definitionNode. Default is true.
 */
export function findChildren(definitionNode: Node, orphanNodes: Node[], isShadowed = true): void {
    const newOrphanNodes: Node[] = [];

    let orphanNode = orphanNodes.shift();
    while (orphanNode) {
        if (
            (!isShadowed ||
            (isShadowed && utils.isNodeShadowedByNode(orphanNode, definitionNode))) &&
            utils.isNodeConnectable(definitionNode, orphanNode)
        ) {
            orphanNode.addTypeNode(definitionNode);

            orphanNode.setParent(definitionNode);
            definitionNode.addChild(orphanNode);
        } else {
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
 * Searches for all definitionNodes in forwarded from Node and in its imports.
 * 
 * @param uri File where is cursor now.
 * @param position Cursor position in file.
 * @param from From which Node do we start searching.
 * @returns Definition Nodes.
 */
export function findDefinitionNodes(uri: string, position: Position, from: Node): Node[] {
    const definitionNodes: Node[] = [];
    _findDefinitionNodes(uri, position, from, definitionNodes);

    return definitionNodes;
}

/**
 * This function looking for a Node that can be connected to the forwarded node.
 * 
 * @param node For which we are trying to find a node that can be connected.
 * @param from From which Node do we start searching.
 * @param searchInInheritanceNodes If it is true, we will look for the parent in the inheritance nodes as well.
 * @returns Node that can connect to the forwarded node.
 */
function search(node: Node, from?: Node | undefined, searchInInheritanceNodes?: boolean, visitedNodes?: Node[], visitedFiles?: string[]): Node | undefined {
    if (!visitedNodes) {
        visitedNodes = [];
    }

    if (!visitedFiles) {
        visitedFiles = [];
    }

    if (!from) {
        return undefined;
    }

    if (visitedNodes.indexOf(from) !== -1) {
        return undefined;
    }

    // Add as visited node
    visitedNodes.push(from);

    let parent: Node | undefined;
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

        parent = search(node, child, searchInInheritanceNodes, visitedNodes);

        if (parent) {
            return parent;
        }
    }

    // Handle inheritance
    if (searchInInheritanceNodes && from.type === "ContractDefinition") {
        const inheritanceNodes = (from as ContractDefinitionNode).getInheritanceNodes();

        for (let i = inheritanceNodes.length - 1; i >= 0; i--) {
            const inheritanceNode = inheritanceNodes[i];

            if (utils.isNodeConnectable(inheritanceNode, node)) {
                return inheritanceNode;
            }

            parent = search(node, inheritanceNode, searchInInheritanceNodes, visitedNodes);

            if (parent) {
                return parent;
            }
        }
    }

    // Handle import
    const matched = searchInImportNodes(visitedFiles, node, from);
    if (matched) {
        return matched;
    }

    return search(node, from.parent, searchInInheritanceNodes, visitedNodes);
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
 function searchInImportNodes(visitedFiles: string[], node: Node, from?: Node | undefined): Node | undefined {
    if (!from) {
        return undefined;
    }

    if (from.type === "ImportDirective") {
        const importPath = (from as ImportDirectiveNode).getImportPath();
        const importAliasNodes = (from as ImportDirectiveNode).getAliasNodes();

        let importNode;
        if (importPath) {
            importNode = cache.getDocumentAnalyzer(importPath)?.analyzerTree;
        }

        if (importNode && visitedFiles.indexOf(importNode.uri) === -1) {
            // Add as visited file
            visitedFiles.push(importNode.uri);

            if (importAliasNodes.length > 0) {
                for (const importAliasNode of importAliasNodes) {
                    if (importAliasNode && node &&
                        importAliasNode.getName() && node.getName() &&
                        importAliasNode.getName() === node.getName()
                    ) {
                        return importAliasNode;
                    }
                }
            } else {
                for (const child of importNode?.children || []) {
                    const matched = searchInImportNodes(visitedFiles, node, child);
    
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
 * @param uri The path to the {@link Node} file.
 * @param position {@link Node} position in file.
 * @returns Wanted {@link Node} if exist.
 */
 function searchInExpressionNode(uri: string, position: Position, expressionNode?: Node | undefined): Node | undefined {
    if (!expressionNode) {
        return undefined;
    }

    if (
        utils.isNodePosition(expressionNode, position) &&
        (expressionNode.uri === uri ||
        (expressionNode.type === "ImportDirective" && (expressionNode as ImportDirectiveNode).realUri === uri))
    ) {
        return expressionNode;
    }

    const matched = searchInExpressionNode(uri, position, expressionNode.getExpressionNode());
    if (matched) {
        return matched;
    }
}

/**
 * Walk through the analyzedTree and try to find Node with forwarded {@link Node.uri uri} and {@link Node.nameLoc position}.
 * 
 * @param uri The path to the {@link Node} file.
 * @param position {@link Node} position in file.
 * @param from From which Node do we start searching.
 * @param searchInExpression Default is false. Set true only if you try to find Nodes 
 * that aren't in orphan Nodes and don't have a parent. Like MemberAccessNode without a parent.
 * @returns Wanted {@link Node} if exist.
 */
 function walk(uri: string, position: Position, from?: Node, searchInExpression = false, visitedNodes?: Node[], visitedFiles?: string[]): Node | undefined {
    if (!visitedNodes) {
        visitedNodes = [];
    }

    if (!visitedFiles) {
        visitedFiles = [];
    }

    if (!from) {
        return undefined;
    }

    if (visitedNodes.indexOf(from) !== -1) {
        return undefined;
    }

    // Add as visited node
    visitedNodes.push(from);

    if (
        utils.isNodePosition(from, position) &&
        (from.uri === uri ||
        (from.type === "ImportDirective" && (from as ImportDirectiveNode).realUri === uri))
    ) {
        return from;
    }

    // Handle import
    if (from.type === "ImportDirective") {
        const importPath = (from as ImportDirectiveNode).getImportPath();
        const importAliasNodes = (from as ImportDirectiveNode).getAliasNodes();

        let importNode;
        if (importPath) {
            importNode = cache.getDocumentAnalyzer(importPath)?.analyzerTree;
        }

        if (importNode && visitedFiles.indexOf(importNode.uri) === -1) {
            // Add as visited file
            visitedFiles.push(importNode.uri);

            let parent: Node | undefined = undefined;
            if (importAliasNodes.length > 0) {
                for (const importAliasNode of importAliasNodes) {
                    parent = walk(uri, position, importAliasNode, searchInExpression, visitedNodes, visitedFiles);

                    if (parent) {
                        break;
                    }
                }
            } else {
                parent = walk(uri, position, importNode, searchInExpression, visitedNodes, visitedFiles);
            }

            if (parent) {
                return parent;
            }
        }
    }

    for (const child of from.children) {
        const parent = walk(uri, position, child, searchInExpression, visitedNodes, visitedFiles);

        if (parent) {
            return parent;
        }
    }

    if (searchInExpression) {
        const expressionNode = searchInExpressionNode(uri, position, from.getExpressionNode());
        if (expressionNode?.type === "MemberAccess") {
            return (expressionNode as MemberAccessNode).getPreviousMemberAccessNode();
        }
    }

    return walk(uri, position, from.parent, searchInExpression, visitedNodes, visitedFiles);
}

/**
 * 
 * @param uri The path to the {@link Node} file.
 * @param position Cursor position in file.
 * @param from From which Node do we start searching.
 * @param definitionNodes When the function is complete, we will find all the definition nodes here.
 * @param isShadowedByParent Is current from node shadowed by position.
 */
function _findDefinitionNodes(uri: string, position: Position, from: Node | undefined, definitionNodes: Node[], isShadowedByParent = false, visitedNodes?: Node[], visitedFiles?: string[]): void {
    if (!visitedNodes) {
        visitedNodes = [];
    }

    if (!visitedFiles) {
        visitedFiles = [];
    }

    if (!from) {
        return;
    }

    if (visitedNodes.indexOf(from) !== -1) {
        return;
    }

    // Add as visited node
    visitedNodes.push(from);

    if ((
            isShadowedByParent ||
            utils.isPositionShadowedByNode(position, from) ||
            from.parent?.type === "SourceUnit"
        ) && (
            definitionNodeTypes.includes(from.type) ||
            declarationNodeTypes.includes(from.type)
        ) &&
        uri === from.uri
    ) {
        isShadowedByParent = true;

        const isVisible = checkIsNodeVisible(uri, position, from, isShadowedByParent);
        if (isVisible) {
            definitionNodes.push(from);
        }
    }
    else if (
        from.parent?.type === "SourceUnit" &&
        definitionNodeTypes.includes(from.type) &&
        uri !== from.uri
    ) {
        const isVisible = checkIsNodeVisible(uri, position, from, false);
        if (isVisible) {
            definitionNodes.push(from);
        }
    }

    if (
        definitionNodeTypes.includes(from.type) &&
        !utils.isPositionShadowedByNode(position, from)
    ) {
        isShadowedByParent = false;
    }

    // Handle import
    if (from.type === "ImportDirective") {
        const importPath = (from as ImportDirectiveNode).getImportPath();
        const importAliasNodes = (from as ImportDirectiveNode).getAliasNodes();

        let importNode;
        if (importPath) {
            importNode = cache.getDocumentAnalyzer(importPath)?.analyzerTree;
        }

        if (importNode && visitedFiles.indexOf(importNode.uri) === -1) {
            // Add as visited file
            visitedFiles.push(importNode.uri);

            if (importAliasNodes.length > 0) {
                for (const importAliasNode of importAliasNodes) {
                    const isVisible = checkIsNodeVisible(uri, position, importAliasNode, false);
                    if (isVisible) {
                        definitionNodes.push(importAliasNode);
                    }
                }
            } else {
                _findDefinitionNodes(uri, position, importNode, definitionNodes, isShadowedByParent, visitedNodes, visitedFiles);
            }
        }
    }

    // Handle inheritance
    if (from.type === "ContractDefinition") {
        const inheritanceNodes = (from as ContractDefinitionNode).getInheritanceNodes();

        for (let i = inheritanceNodes.length - 1; i >= 0; i--) {
            const inheritanceNode = inheritanceNodes[i];

            for (const child of inheritanceNode.children) {
                const childVisibility = getNodeVisibility(child);
                const isVisible = checkIsNodeVisible(uri, position, child, false);

                if (isVisible || childVisibility === "internal") {
                    definitionNodes.push(child);
                }
            }
        }
    }

    for (const child of from.children) {
        _findDefinitionNodes(uri, position, child, definitionNodes, isShadowedByParent, visitedNodes, visitedFiles);
    }
}

/**
 * @returns Node visibility type.
 */
function getNodeVisibility(node: Node): string | undefined {
    if (node.type === "FunctionDefinition") {
        return (node as FunctionDefinitionNode).getVisibility();
    } else if (node.type === "VariableDeclaration") {
        return (node as VariableDeclarationNode).getVisibility();
    }

    return undefined;
}

/**
 * @param uri The path to the {@link Node} file.
 * @param position Cursor position in file.
 * @param node That we will try to add in definitionNodes.
 * @param isShadowedByParent Is current from node shadowed by position.
 * 
 * @returns If the node is visible, we will return true, otherwise it will be false.
 */
export function checkIsNodeVisible(uri: string, position: Position, node: Node, isShadowedByParent: boolean): boolean {
    const visibility = getNodeVisibility(node);

    if (!visibility || (visibility && ["default", "public"].includes(visibility))) {
        return true;
    }
    else if (
        ["internal", "private"].includes(visibility) && uri === node.uri &&
        (utils.isPositionShadowedByNode(position, node) || isShadowedByParent)
    ) {
        return true;
    }
    else if (
        visibility === "external" && !isShadowedByParent &&
        !utils.isPositionShadowedByNode(position, node)
    ) {
        return true;
    }

    return false;
}
