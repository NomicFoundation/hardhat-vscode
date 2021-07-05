import { EmitStatement, FinderType, DocumentsAnalyzerMap, Node } from "@common/types";

export class EmitStatementNode extends Node {
    astNode: EmitStatement;

    constructor (emitStatement: EmitStatement, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap) {
        super(emitStatement, uri, rootPath, documentsAnalyzer);
        this.astNode = emitStatement;
    }

    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node {
        this.setExpressionNode(expression);

        find(this.astNode.eventCall, this.uri, this.rootPath, this.documentsAnalyzer).accept(find, orphanNodes, parent, this);

        return this;
    }
}
