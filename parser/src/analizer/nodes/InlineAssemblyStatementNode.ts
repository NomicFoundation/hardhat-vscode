import { InlineAssemblyStatement } from "@solidity-parser/parser/dist/ast-types";

import { Location, FinderType, Node } from "./Node";

export class InlineAssemblyStatementNode implements Node {
    type: string;
    uri: string;
    astNode: InlineAssemblyStatement;

    nameLoc?: Location | undefined;

    parent?: Node | undefined;
    children: Node[] = [];

    constructor (inlineAssemblyStatement: InlineAssemblyStatement, uri: string) {
        this.type = inlineAssemblyStatement.type;
        this.uri = uri;
        this.astNode = inlineAssemblyStatement;
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
