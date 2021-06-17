import { ReturnStatement, FinderType, Node } from "@common/types";

export class ReturnStatementNode extends Node {
    astNode: ReturnStatement;

    constructor (returnStatement: ReturnStatement, uri: string) {
        super(returnStatement, uri);
        this.astNode = returnStatement;
    }

    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node {
        this.setExpressionNode(expression);

        if (this.astNode.expression) {
            find(this.astNode.expression, this.uri).accept(find, orphanNodes, parent);
        }

        return this;
    }
}
