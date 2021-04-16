import { ArrayTypeName } from "@solidity-parser/parser/dist/ast-types";

import { Location, FinderType, Node } from "./Node";

export class ArrayTypeNameNode implements Node {
    type: string;
    uri: string;
    astNode: ArrayTypeName;

    nameLoc?: Location | undefined;

    parent?: Node | undefined;
    children: Node[] = [];

    constructor (arrayTypeName: ArrayTypeName, uri: string) {
        this.type = arrayTypeName.type;
        this.uri = uri;
        this.astNode = arrayTypeName;
        // TO-DO: Implement name location for rename
    }

    addChild(child: Node): void {
        this.children.push(child);
    }

    setParent(parent: Node): void {
        this.parent = parent;
    }

    accept(find: FinderType, orphanNodes: Node[], parent?: Node): void {
        // TO-DO: Method not implemented
    }
}
