import { IfStatement } from "@solidity-parser/parser/dist/src/ast-types";

import { Location, FinderType, Node } from "./Node";

export class IfStatementNode implements Node {
    type: string;
    uri: string;
    astNode: IfStatement;

    nameLoc?: Location | undefined;

    parent?: Node | undefined;
    children: Node[] = [];

    typeNodes: Node[] = [];

    constructor (ifStatement: IfStatement, uri: string) {
        this.type = ifStatement.type;
        this.uri = uri;
        this.astNode = ifStatement;
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
        find(this.astNode.trueBody, this.uri).accept(find, orphanNodes, this);

        if (this.astNode.falseBody) {
            find(this.astNode.falseBody, this.uri).accept(find, orphanNodes, this);
        }

        parent?.addChild(this);

        return this;
    }
}
