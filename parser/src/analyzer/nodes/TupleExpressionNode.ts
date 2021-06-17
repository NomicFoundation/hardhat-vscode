import { TupleExpression, FinderType, Node } from "@common/types";

export class TupleExpressionNode extends Node {
    astNode: TupleExpression;

    constructor (tupleExpression: TupleExpression, uri: string) {
        super(tupleExpression, uri);
        this.astNode = tupleExpression;
    }

    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node {
        this.setExpressionNode(expression);

        for (const component of this.astNode.components) {
            if (component) {
                find(component, this.uri).accept(find, orphanNodes, parent);
            }
        }

        return this;
    }
}
