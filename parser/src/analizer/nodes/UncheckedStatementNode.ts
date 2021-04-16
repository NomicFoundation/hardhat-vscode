import { UncheckedStatement } from "@solidity-parser/parser/dist/ast-types";

import { Location, FinderType, Node } from "./Node";

export class UncheckedStatementNode implements Node {
    type: string;
    uri: string;
    astNode: UncheckedStatement;

    nameLoc?: Location | undefined;

    parent?: Node | undefined;
    children: Node[] = [];

    constructor (uncheckedStatement: UncheckedStatement, uri: string) {
        this.type = uncheckedStatement.type;
        this.uri = uri;
        this.astNode = uncheckedStatement;
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
