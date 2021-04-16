import { AST, SourceUnit } from "@solidity-parser/parser/dist/ast-types";

import { Location, Node } from "./Node";

export class SourceUnitNode implements Node {
    type: string;

    uri: string;
    nameLoc?: Location | undefined;

    parent?: Node | undefined;
    children: Node[] = [];

    astNode: AST;

    constructor (sourceUnit: SourceUnit, uri: string) {
        this.type = sourceUnit.type;

        this.uri = uri;
        // TO-DO: Implement name location for rename

        this.astNode = sourceUnit;
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
