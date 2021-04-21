import { Node } from "./nodes/Node";

export namespace Finder {
    let visitedNodes: Node[] = [];

    let analyzerTree: Node | undefined;

    export function setRoot (rootNode: Node) {
        analyzerTree = rootNode;
    }

    export function findParent (node: Node, from?: Node): Node | undefined {
        visitedNodes = [];

        // If from Node doesn't exist start finding from the root of the analyzer tree
        if (!from) {
            from = analyzerTree;
        }

        const parent = search(node, from);

        if (parent && node.getName()) {
            return goUp(parent, "" + node.getName());
        }

        return parent;
    }

    function search (node: Node, from?: Node): Node | undefined {
        if (!from || !node.getName()) {
            return undefined;
        }

        if (visitedNodes.indexOf(from) !== -1) {
            return undefined;
        }

        // Add as visited node
        visitedNodes.push(from);

        if (node.getName() === from.getName()) {
            return from;
        }

        let parent: Node | undefined;
        for (const child of from.children) {
            parent = search(node, child);

            if (parent) {
                return parent;
            }
        }

        return search(node, from.parent);
    }

    function goUp (node: Node, name: string): Node {
        if (node.parent?.getName() === name) {
            node = goUp(node.parent, name);
        }

        return node;
    };
}
