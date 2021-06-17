import { TryStatement, FinderType, Node } from "@common/types";

export class TryStatementNode extends Node {
    astNode: TryStatement;

    constructor (tryStatement: TryStatement, uri: string) {
        super(tryStatement, uri);
        this.astNode = tryStatement;
    }

    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node {
        this.setExpressionNode(expression);

        if (parent) {
            this.setParent(parent);
        }

        find(this.astNode.expression, this.uri).accept(find, orphanNodes, this);

        for (const returnParameter of this.astNode.returnParameters || []) {
            find(returnParameter, this.uri).accept(find, orphanNodes, this);
        }

        find(this.astNode.body, this.uri).accept(find, orphanNodes, this);

        for (const catchClause of this.astNode.catchClauses || []) {
            find(catchClause, this.uri).accept(find, orphanNodes, this);
        }

        parent?.addChild(this);

        return this;
    }
}
