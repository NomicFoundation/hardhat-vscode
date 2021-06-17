import { BreakStatement, FinderType, Node } from "@common/types";

export class BreakStatementNode extends Node {
    astNode: BreakStatement;

    constructor (breakStatement: BreakStatement, uri: string) {
        super(breakStatement, uri);
        this.astNode = breakStatement;
        // TO-DO: Implement name location for rename
    }

    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node {
        this.setExpressionNode(expression);
        // TO-DO: Method not implemented
        return this;
    }
}
