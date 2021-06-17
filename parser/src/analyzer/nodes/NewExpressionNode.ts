import { NewExpression, FinderType, Node } from "@common/types";

export class NewExpressionNode extends Node {
    astNode: NewExpression;

    constructor (newExpression: NewExpression, uri: string) {
        super(newExpression, uri);
        this.astNode = newExpression;
    }

    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node {
        this.setExpressionNode(expression);

        if (this.astNode.typeName) {
            find(this.astNode.typeName, this.uri).accept(find, orphanNodes, parent);
        }

        return this;
    }
}
