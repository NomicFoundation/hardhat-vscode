import { ExpressionStatement } from "@solidity-parser/parser/dist/ast-types";

import { Location, FinderType, Node } from "./Node";

export class ExpressionStatementNode implements Node {
    type: string;
    uri: string;
    astNode: ExpressionStatement;

    nameLoc?: Location | undefined;

    parent?: Node | undefined;
    children: Node[] = [];

    constructor (expressionStatement: ExpressionStatement, uri: string) {
        this.type = expressionStatement.type;
        this.uri = uri;
        this.astNode = expressionStatement;
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
