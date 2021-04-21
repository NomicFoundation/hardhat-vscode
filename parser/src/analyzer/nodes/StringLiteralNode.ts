import { StringLiteral } from "@solidity-parser/parser/dist/ast-types";

import { Location, FinderType, Node } from "./Node";

export class StringLiteralNode implements Node {
    type: string;
    uri: string;
    astNode: StringLiteral;

    nameLoc?: Location | undefined;

    parent?: Node | undefined;
    children: Node[] = [];

    constructor (stringLiteral: StringLiteral, uri: string) {
        this.type = stringLiteral.type;
        this.uri = uri;
        this.astNode = stringLiteral;
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

    accept(find: FinderType, orphanNodes: Node[], parent?: Node): void {
        // TO-DO: Method not implemented
    }
}
