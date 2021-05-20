import { Position, Node, ContractDefinitionNode } from "./nodes/Node";

let visitedNodes: Node[] = [];
export let analyzerTree: Node | undefined;

export function setRoot(rootNode: Node) {
    analyzerTree = rootNode;
}

export function findParent(node: Node, from?: Node, searchInInheretenceNodes?: boolean): Node | undefined {
    visitedNodes = [];
    let parent: Node | undefined;

    // If from Node doesn't exist start finding from the root of the analyzer tree
    if (!from) {
        parent = search(node, analyzerTree, searchInInheretenceNodes);
    } else {
        parent = search(node, from, searchInInheretenceNodes);
    }

    if (parent) {
        return parent.getDefinitionNode();
    }

    return parent;
}

export function findNodeByPosition(position: Position, from?: Node): Node | undefined {
    visitedNodes = [];
    const node = walk(position, from || analyzerTree);

    if (node) {
        return node.getDefinitionNode();
    }

    return node;
}

export function findChildren(definitionNode: Node, orphanNodes: Node[]): void {
    const newOrphanNodes: Node[] = [];
    const expressionNodes: Node[] = [];

    let orphanNode = orphanNodes.shift();
    while (orphanNode) {
        if (isNodeConnectable(definitionNode, orphanNode)) {
            orphanNode.addTypeNode(definitionNode);

            orphanNode.setParent(definitionNode);
            definitionNode.addChild(orphanNode);

            expressionNodes.push(orphanNode);
        } else {
            newOrphanNodes.push(orphanNode);
        }

        orphanNode = orphanNodes.shift();
    }

    // Return to orphanNodes array unhandled orphan nodes
    for (const newOrphanNode of newOrphanNodes) {
        orphanNodes.push(newOrphanNode);
    }

    // Find type references for all expressions
    for (const expressionNode of expressionNodes) {
        findExpressionNodes(definitionNode, expressionNode, orphanNodes);
    }
}

function findExpressionNodes(definitionNode: Node, node: Node, orphanNodes: Node[]): void {
    const newOrphanNodes: Node[] = [];
    let declarationNode = node.getDeclarationNode();

    if (!declarationNode) {
        if (node.getExpressionNode()) {
            declarationNode = node;
        } else {
            return;
        }
    }

    let orphanNode = orphanNodes.shift();
    while (orphanNode) {

        if (matchNodeExpression(orphanNode, declarationNode)) {
            for (const definitionChild of definitionNode.children) {

                if (definitionChild.getName() && definitionChild.getName() === orphanNode.getName()) {
                    orphanNode.addTypeNode(definitionChild);

                    orphanNode.setParent(definitionChild);
                    definitionChild?.addChild(orphanNode);

                    nestNode(orphanNode, orphanNodes);
                }
            }
        } else {
            newOrphanNodes.push(orphanNode);
        }

        orphanNode = orphanNodes.shift();
    }

    for (const newOrphanNode of newOrphanNodes) {
        orphanNodes.push(newOrphanNode);
    }
}

function nestNode(node: Node, orphanNodes: Node[]): void {
    const expressionNode = getMemberAccessNodeFromExpression(node);
    if (!expressionNode) {
        return;
    }

    const orphanNode = orphanNodes.shift();
    if (!orphanNode) {
        return;
    }

    if (isNodeEqual(expressionNode, orphanNode)) {
        for (const definitionType of node.getTypeNodes()) {
            for (const definitionChild of definitionType.children) {
                if (definitionChild.getName() && definitionChild.getName() === orphanNode.getName()) {
                    orphanNode.addTypeNode(definitionChild);

                    orphanNode.setParent(definitionChild);
                    definitionChild?.addChild(orphanNode);

                    nestNode(orphanNode, orphanNodes);
                }
            }
        }
    } else {
        orphanNodes.unshift(orphanNode);
    }
}

function search(node: Node, from?: Node | undefined, searchInInheretenceNodes?: boolean): Node | undefined {
    if (!from) {
        return undefined;
    }

    if (visitedNodes.indexOf(from) !== -1) {
        return undefined;
    }

    // Add as visited node
    visitedNodes.push(from);

    let parent: Node | undefined;
    if (isNodeConnectable(from, node)) {
        return from;
    }

    for (const child of from.children) {
        if ([ "FunctionDefinition", "ContractDefinition", "StructDefinition" ].includes(child.type)) {
            if (isNodeConnectable(child, node)) {
                return child;
            }

            continue;
        }

        parent = search(node, child, searchInInheretenceNodes);

        if (parent) {
            return parent;
        }
    }

    // Handle inheritance
    if (searchInInheretenceNodes && from.type === "ContractDefinition") {
        const inheritanceNodes = (from as ContractDefinitionNode).getInheritanceNodes();

        for (let i = inheritanceNodes.length - 1; i >= 0; i--) {
            const inheritanceNode = inheritanceNodes[i];

            if (isNodeConnectable(inheritanceNode, node)) {
                return inheritanceNode;
            }

            parent = search(node, inheritanceNode, searchInInheretenceNodes);

            if (parent) {
                return parent;
            }
        }
    }

    return search(node, from.parent, searchInInheretenceNodes);
}

function walk(position: Position, from?: Node): Node | undefined {
    if (!from) {
        return undefined;
    }

    if (visitedNodes.indexOf(from) !== -1) {
        return undefined;
    }

    // Add as visited node
    visitedNodes.push(from);

    if (
        from.nameLoc &&
        from.nameLoc.start.line === position.line &&
        from.nameLoc.end.line === position.line &&
        from.nameLoc.start.column <= position.column &&
        from.nameLoc.end.column >= position.column
    ) {
        return from;
    }

    let parent: Node | undefined;
    for (const child of from.children) {
        parent = walk(position, child);

        if (parent) {
            return parent;
        }
    }

    return walk(position, from.parent);
}

function matchNodeExpression(expression: Node, node: Node): boolean {
    let expressionNode = getMemberAccessNodeFromExpression(node);

    if (isNodeEqual(expressionNode, expression)) {
        return true;
    }

    for (const child of node.children) {
        expressionNode = getMemberAccessNodeFromExpression(child);

        if (isNodeEqual(expressionNode, expression)) {
            return true;
        }
    }

    return false;
}

function getMemberAccessNodeFromExpression(node: Node): Node | undefined {
    let expressionNode = node.getExpressionNode();

    while (expressionNode && expressionNode.type !== "MemberAccess") {
        expressionNode = expressionNode.getExpressionNode();
    }

    return expressionNode;
}

function isNodeEqual(first: Node | undefined, second: Node | undefined): boolean {
    if (
        first && second &&
        first.nameLoc && second.nameLoc &&
        JSON.stringify(first.nameLoc) === JSON.stringify(second.nameLoc) &&
        first.getName() === second.getName()
    ) {
        return true;
    }

    return false;
}

function isNodeConnectable(parent: Node | undefined, child: Node | undefined): boolean {
    if (
        parent && child &&
        parent.getName() && child.getName() &&
        parent.getName() === child.getName() && (
            parent.connectionTypeRules.includes(child.type) ||
            parent.connectionTypeRules.includes(child.getExpressionNode()?.type || "")
    )) {
        return true;
    }

    return false;
}
