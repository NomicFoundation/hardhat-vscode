import { InlineAssemblyStatement, FinderType, Node } from "@common/types";

export class InlineAssemblyStatementNode extends Node {
    astNode: InlineAssemblyStatement;

    constructor (inlineAssemblyStatement: InlineAssemblyStatement, uri: string, rootPath: string) {
        super(inlineAssemblyStatement, uri, rootPath);
        this.astNode = inlineAssemblyStatement;
    }

    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node {
        this.setExpressionNode(expression);

        if (this.astNode.body) {
            find(this.astNode.body, this.uri, this.rootPath).accept(find, orphanNodes, parent);
        }

        return this;
    }
}
