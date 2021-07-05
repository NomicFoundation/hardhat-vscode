import { ReturnStatement, FinderType, Node } from "@common/types";

export class ReturnStatementNode extends Node {
    astNode: ReturnStatement;

    constructor (returnStatement: ReturnStatement, uri: string, rootPath: string) {
        super(returnStatement, uri, rootPath);
        this.astNode = returnStatement;
    }

    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node {
        this.setExpressionNode(expression);

        if (this.astNode.expression) {
            find(this.astNode.expression, this.uri, this.rootPath).accept(find, orphanNodes, parent);
        }

        return this;
    }
}
