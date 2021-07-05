import { UnaryOperation, FinderType, Node } from "@common/types";

export class UnaryOperationNode extends Node {
    astNode: UnaryOperation;

    constructor (unaryOperation: UnaryOperation, uri: string, rootPath: string) {
        super(unaryOperation, uri, rootPath);
        this.astNode = unaryOperation;
    }

    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node {
        this.setExpressionNode(expression);

        find(this.astNode.subExpression, this.uri, this.rootPath).accept(find, orphanNodes, parent);

        return this;
    }
}
