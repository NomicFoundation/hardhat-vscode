import { InlineAssemblyStatement, FinderType, Node } from "@common/types";

export class InlineAssemblyStatementNode extends Node {
    astNode: InlineAssemblyStatement;

    constructor (inlineAssemblyStatement: InlineAssemblyStatement, uri: string) {
        super(inlineAssemblyStatement, uri);
        this.astNode = inlineAssemblyStatement;
    }

    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node {
        this.setExpressionNode(expression);

        if (this.astNode.body) {
            find(this.astNode.body, this.uri).accept(find, orphanNodes, parent);
        }

        return this;
    }
}
