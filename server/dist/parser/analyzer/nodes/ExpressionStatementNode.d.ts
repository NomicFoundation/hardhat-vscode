import { ExpressionStatement, FinderType, DocumentsAnalyzerMap, Node } from "@common/types";
export declare class ExpressionStatementNode extends Node {
    astNode: ExpressionStatement;
    constructor(expressionStatement: ExpressionStatement, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap);
    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node;
}
