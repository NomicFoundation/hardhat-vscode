import { ArrayTypeName } from "@solidity-parser/parser/dist/src/ast-types";

import { Location, FinderType, Node } from "./Node";

export class ArrayTypeNameNode implements Node {
    type: string;
    uri: string;
    astNode: ArrayTypeName;

    nameLoc?: Location | undefined;

    parent?: Node | undefined;
    children: Node[] = [];

    typeNodes: Node[] = [];

    constructor (arrayTypeName: ArrayTypeName, uri: string) {
        this.type = arrayTypeName.type;
        this.uri = uri;
        this.astNode = arrayTypeName;
        // TO-DO: Implement name location for rename
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
        const typeNode = find(this.astNode.baseTypeName, this.uri).accept(find, orphanNodes, parent);

        if (typeNode) {
            this.typeNodes.push(typeNode);
        }

        return this;
    }
}
