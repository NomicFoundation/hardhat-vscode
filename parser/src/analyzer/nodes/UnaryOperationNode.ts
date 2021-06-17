import { UnaryOperation, FinderType, Node } from "@common/types";

export class UnaryOperationNode extends Node {
    astNode: UnaryOperation;

    constructor (unaryOperation: UnaryOperation, uri: string) {
        super(unaryOperation, uri);
        this.astNode = unaryOperation;
    }

    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node {
        this.setExpressionNode(expression);

        find(this.astNode.subExpression, this.uri).accept(find, orphanNodes, parent);

        return this;
    }
}
