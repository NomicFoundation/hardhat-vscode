import { EmitStatement, FinderType, Node } from "@common/types";

export class EmitStatementNode extends Node {
    astNode: EmitStatement;

    constructor (emitStatement: EmitStatement, uri: string, rootPath: string) {
        super(emitStatement, uri, rootPath);
        this.astNode = emitStatement;
    }

    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node {
        this.setExpressionNode(expression);

        find(this.astNode.eventCall, this.uri, this.rootPath).accept(find, orphanNodes, parent, this);

        return this;
    }
}
