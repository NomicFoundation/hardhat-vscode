import { ForStatement } from "@solidity-parser/parser/dist/src/ast-types";

import { Location, FinderType, Node, Position } from "./Node";

export class ForStatementNode implements Node {
    type: string;
    uri: string;
    astNode: ForStatement;

    nameLoc?: Location | undefined;

    parent?: Node | undefined;
    children: Node[] = [];

    typeNodes: Node[] = [];

    constructor (forStatement: ForStatement, uri: string) {
        this.type = forStatement.type;
        this.uri = uri;
        this.astNode = forStatement;
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

        if (this.astNode.initExpression) {
            find(this.astNode.initExpression, this.uri).accept(find, orphanNodes, this);
        }
        if (this.astNode.conditionExpression) {
            find(this.astNode.conditionExpression, this.uri).accept(find, orphanNodes, this);
        }
        if (this.astNode.loopExpression) {
            find(this.astNode.loopExpression, this.uri).accept(find, orphanNodes, this);
        }

        find(this.astNode.body, this.uri).accept(find, orphanNodes, this);

        parent?.addChild(this);

        return this;
    }

    getDefinitionNode(): Node {
        // TO-DO: Method not implemented
        return this;
    }
}
