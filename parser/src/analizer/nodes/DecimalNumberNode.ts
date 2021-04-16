import { AST, DecimalNumber } from "@solidity-parser/parser/dist/ast-types";

import { Location, Node } from "./Node";

export class DecimalNumberNode implements Node {
    type: string;

    uri: string;
    nameLoc?: Location | undefined;

    parent?: Node | undefined;
    children: Node[] = [];

    astNode: AST;

    constructor (decimalNumber: DecimalNumber, uri: string) {
        this.type = decimalNumber.type;

        this.uri = uri;
        // TO-DO: Implement name location for rename

        this.astNode = decimalNumber;
    }

    addChild(child: Node): void {
        this.children.push(child);
    }

    setParent(parent: Node): void {
        this.parent = parent;
    }

    accept(orphanNodes: Node[], parent?: Node): void {
        // TO-DO: Method not implemented
    }
}
