import { Conditional, FinderType, Node } from "@common/types";

export class ConditionalNode extends Node {
    astNode: Conditional;

    constructor (conditional: Conditional, uri: string, rootPath: string) {
        super(conditional, uri, rootPath);
        this.astNode = conditional;
    }

    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node {
        this.setExpressionNode(expression);

        if (this.astNode.condition) {
            find(this.astNode.condition, this.uri, this.rootPath).accept(find, orphanNodes, parent);
        }

        if (this.astNode.trueExpression) {
            find(this.astNode.trueExpression, this.uri, this.rootPath).accept(find, orphanNodes, parent);
        }

        if (this.astNode.falseExpression) {
            find(this.astNode.falseExpression, this.uri, this.rootPath).accept(find, orphanNodes, parent);
        }

        return this;
    }
}
