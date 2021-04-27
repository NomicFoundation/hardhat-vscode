import { UnaryOperation } from "@solidity-parser/parser/dist/ast-types";

import { Location, FinderType, Node } from "./Node";

export class UnaryOperationNode implements Node {
    type: string;
    uri: string;
    astNode: UnaryOperation;

    nameLoc?: Location | undefined;

    parent?: Node | undefined;
    children: Node[] = [];

    typeNodes: Node[] = [];

    constructor (unaryOperation: UnaryOperation, uri: string) {
        this.type = unaryOperation.type;
        this.uri = uri;
        this.astNode = unaryOperation;
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
        find(this.astNode.subExpression, this.uri).accept(find, orphanNodes, parent);

        return this;
    }
}
