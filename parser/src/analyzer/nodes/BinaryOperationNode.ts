import { BinaryOperation, FinderType, Node } from "@common/types";

export class BinaryOperationNode extends Node {
    astNode: BinaryOperation;

    constructor (binaryOperation: BinaryOperation, uri: string, rootPath: string) {
        super(binaryOperation, uri, rootPath);
        this.astNode = binaryOperation;
    }

    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node {
        this.setExpressionNode(expression);

        find(this.astNode.left, this.uri, this.rootPath).accept(find, orphanNodes, parent);
        find(this.astNode.right, this.uri, this.rootPath).accept(find, orphanNodes, parent);

        return this;
    }
}
