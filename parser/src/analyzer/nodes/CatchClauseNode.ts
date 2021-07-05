import { CatchClause, FinderType, Node } from "@common/types";

export class CatchClauseNode extends Node {
    astNode: CatchClause;

    constructor (catchClause: CatchClause, uri: string, rootPath: string) {
        super(catchClause, uri, rootPath);
        this.astNode = catchClause;
    }

    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node {
        this.setExpressionNode(expression);

        if (parent) {
            this.setParent(parent);
        }

        for (const param of this.astNode.parameters || []) {
            find(param, this.uri, this.rootPath).accept(find, orphanNodes, this);
        }

        find(this.astNode.body, this.uri, this.rootPath).accept(find, orphanNodes, this);

        parent?.addChild(this);

        return this;
    }
}
