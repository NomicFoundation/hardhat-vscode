import { BreakStatement, FinderType, DocumentsAnalyzerMap, Node } from "@common/types";

export class BreakStatementNode extends Node {
    astNode: BreakStatement;

    constructor (breakStatement: BreakStatement, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap) {
        super(breakStatement, uri, rootPath, documentsAnalyzer);
        this.astNode = breakStatement;
        // TO-DO: Implement name location for rename
    }

    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node {
        this.setExpressionNode(expression);
        // TO-DO: Method not implemented
        return this;
    }
}
