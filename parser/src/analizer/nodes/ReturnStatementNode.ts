import { ReturnStatement } from "@solidity-parser/parser/dist/ast-types";

import { Location, FinderType, Node } from "./Node";

export class ReturnStatementNode implements Node {
    type: string;
    uri: string;
    astNode: ReturnStatement;

    nameLoc?: Location | undefined;

    parent?: Node | undefined;
    children: Node[] = [];

    constructor (returnStatement: ReturnStatement, uri: string) {
        this.type = returnStatement.type;
        this.uri = uri;
        this.astNode = returnStatement;
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
