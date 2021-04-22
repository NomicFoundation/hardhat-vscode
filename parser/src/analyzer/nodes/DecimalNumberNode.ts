import { DecimalNumber } from "@solidity-parser/parser/dist/ast-types";

import { Location, FinderType, Node } from "./Node";

export class DecimalNumberNode implements Node {
    type: string;
    uri: string;
    astNode: DecimalNumber;

    nameLoc?: Location | undefined;

    parent?: Node | undefined;
    children: Node[] = [];

    constructor (decimalNumber: DecimalNumber, uri: string) {
        this.type = decimalNumber.type;
        this.uri = uri;
        this.astNode = decimalNumber;
        // TO-DO: Implement name location for rename
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
        // TO-DO: Method not implemented
        return this;
    }
}
