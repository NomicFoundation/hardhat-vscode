import { IndexAccess } from "@solidity-parser/parser/dist/ast-types";

import { Location, FinderType, Node } from "./Node";

export class IndexAccessNode implements Node {
    type: string;
    uri: string;
    astNode: IndexAccess;

    nameLoc?: Location | undefined;

    parent?: Node | undefined;
    children: Node[] = [];

    typeNodes: Node[] = [];

    constructor (indexAccess: IndexAccess, uri: string) {
        this.type = indexAccess.type;
        this.uri = uri;
        this.astNode = indexAccess;
    }

    getTypeNodes(): Node[] {
        let nodes: Node[] = [];

        this.typeNodes.forEach(typeNode => {
            nodes = nodes.concat(typeNode.getTypeNodes());
        });

        return nodes;
    }

    getName(): string | undefined {
        return undefined;
    }

    addChild(child: Node): void {
        this.children.push(child);
    }

    setParent(parent: Node): void {
        this.parent = parent;
    }

    accept(find: FinderType, orphanNodes: Node[], parent?: Node): Node {
        const typeNode = find(this.astNode.base, this.uri).accept(find, orphanNodes, parent);
        find(this.astNode.index, this.uri).accept(find, orphanNodes, parent);

        this.typeNodes.push(typeNode);

        return this;
    }
}
