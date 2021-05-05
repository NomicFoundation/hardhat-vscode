import { Position, Node } from "./nodes/Node";

let visitedNodes: Node[] = [];
export let analyzerTree: Node | undefined;

export function setRoot(rootNode: Node) {
    analyzerTree = rootNode;
}

export function findParent(node: Node, from?: Node): Node | undefined {
    visitedNodes = [];
    let parent: Node | undefined;

    // If from Node doesn't exist start finding from the root of the analyzer tree
    if (!from) {
        parent = search(node, analyzerTree);
    } else {
        parent = search(node, from, true);
    }

    if (parent && node.getName()) {
        return goUp(parent, "" + node.getName());
    }

    return parent;
}

export function findNodeByPosition(position: Position, from?: Node): Node | undefined {
    visitedNodes = [];
    const node = walk(position, from || analyzerTree);

    if (node?.getName()) {
        return goUp(node, "" + node.getName());
    }

    return node;
}

function search(node: Node, from?: Node | undefined, bottomUp = false): Node | undefined {
    if (!from) {
        return undefined;
    }

    if (visitedNodes.indexOf(from) !== -1) {
        return undefined;
    }

    // Add as visited node
    visitedNodes.push(from);

    if (node.getName() && from.getName() && node.getName() === from.getName()) {
        return from;
    }

    let parent: Node | undefined;
    for (const child of from.children) {
        if (!bottomUp && child.type === 'FunctionDefinition') {
            continue;
        }

        parent = search(node, child, bottomUp);

        if (parent) {
            return parent;
        }
    }

    return search(node, from.parent, bottomUp);
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

function goUp(node: Node, name: string): Node {
    if (node.parent?.getName() === name) {
        node = goUp(node.parent, name);
    }

    return node;
}
