import { ExpressionStatement, FinderType, Node } from "@common/types";

export class ExpressionStatementNode extends Node {
    astNode: ExpressionStatement;

    constructor (expressionStatement: ExpressionStatement, uri: string, rootPath: string) {
        super(expressionStatement, uri, rootPath);
        this.astNode = expressionStatement;
    }

    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node {
        this.setExpressionNode(expression);

        if (this.astNode.expression) {
            find(this.astNode.expression, this.uri, this.rootPath).accept(find, orphanNodes, parent);
        }

        return this;
    }
}
