import { Node } from "./nodes/Node";

export namespace Finder {
    let analyzerTree: Node | undefined;

    export function setRoot (rootNode: Node) {
        analyzerTree = rootNode;
    }

    export function findParent (node: Node, from: Node): Node | undefined {
        return undefined;
    }
}
