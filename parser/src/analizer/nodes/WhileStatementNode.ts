import { WhileStatement } from "@solidity-parser/parser/dist/ast-types";

import { Location, FinderType, Node } from "./Node";

export class WhileStatementNode implements Node {
    type: string;
    uri: string;
    astNode: WhileStatement;

    nameLoc?: Location | undefined;

    parent?: Node | undefined;
    children: Node[] = [];

    constructor (whileStatement: WhileStatement, uri: string) {
        this.type = whileStatement.type;
        this.uri = uri;
        this.astNode = whileStatement;
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
