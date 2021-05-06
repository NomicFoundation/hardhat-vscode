import { WhileStatement } from "@solidity-parser/parser/dist/src/ast-types";

import { Location, FinderType, Node, Position } from "./Node";

export class WhileStatementNode implements Node {
    type: string;
    uri: string;
    astNode: WhileStatement;

    nameLoc?: Location | undefined;

    parent?: Node | undefined;
    children: Node[] = [];

    typeNodes: Node[] = [];

    constructor (whileStatement: WhileStatement, uri: string) {
        this.type = whileStatement.type;
        this.uri = uri;
        this.astNode = whileStatement;
    }

    getTypeNodes(): Node[] {
        return this.typeNodes;
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
        if (parent) {
            this.setParent(parent);
        }

        find(this.astNode.condition, this.uri).accept(find, orphanNodes, this);
        find(this.astNode.body, this.uri).accept(find, orphanNodes, this);

        parent?.addChild(this);

        return this;
    }

    getDefinitionNode(): Node {
        // TO-DO: Method not implemented
        return this;
    }
}
