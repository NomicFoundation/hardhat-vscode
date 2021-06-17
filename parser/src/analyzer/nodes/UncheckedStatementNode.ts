import { UncheckedStatement, FinderType, Node } from "@common/types";

export class UncheckedStatementNode extends Node {
    astNode: UncheckedStatement;

    constructor (uncheckedStatement: UncheckedStatement, uri: string) {
        super(uncheckedStatement, uri);
        this.astNode = uncheckedStatement;
    }

    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node {
        this.setExpressionNode(expression);

        if (this.astNode.block) {
            find(this.astNode.block, this.uri).accept(find, orphanNodes, parent);
        }

        return this;
    }
}
