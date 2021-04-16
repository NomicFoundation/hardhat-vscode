import { BooleanLiteral } from "@solidity-parser/parser/dist/ast-types";

import { Location, FinderType, Node } from "./Node";

export class BooleanLiteralNode implements Node {
    type: string;
    uri: string;
    astNode: BooleanLiteral;

    nameLoc?: Location | undefined;

    parent?: Node | undefined;
    children: Node[] = [];

    constructor (booleanLiteral: BooleanLiteral, uri: string) {
        this.type = booleanLiteral.type;
        this.uri = uri;
        this.astNode = booleanLiteral;
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
