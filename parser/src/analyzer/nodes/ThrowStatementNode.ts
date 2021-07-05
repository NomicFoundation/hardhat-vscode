import { ThrowStatement, FinderType, Node } from "@common/types";

export class ThrowStatementNode extends Node {
    astNode: ThrowStatement;

    constructor (throwStatement: ThrowStatement, uri: string, rootPath: string) {
        super(throwStatement, uri, rootPath);
        this.astNode = throwStatement;
        // TO-DO: Implement name location for rename
    }

    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node {
        this.setExpressionNode(expression);
        // TO-DO: Method not implemented
        return this;
    }
}
