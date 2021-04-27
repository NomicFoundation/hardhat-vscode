import { BinaryOperation } from "@solidity-parser/parser/dist/ast-types";

import { Location, FinderType, Node } from "./Node";

export class BinaryOperationNode implements Node {
    type: string;
    uri: string;
    astNode: BinaryOperation;

    nameLoc?: Location | undefined;

    parent?: Node | undefined;
    children: Node[] = [];

    typeNodes: Node[] = [];

    constructor (binaryOperation: BinaryOperation, uri: string) {
        this.type = binaryOperation.type;
        this.uri = uri;
        this.astNode = binaryOperation;
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
        find(this.astNode.left, this.uri).accept(find, orphanNodes, parent);
        find(this.astNode.right, this.uri).accept(find, orphanNodes, parent);

        return this;
    }
}
