import { BreakStatement, FinderType, DocumentsAnalyzerMap, Node } from "@common/types";
export declare class BreakStatementNode extends Node {
    astNode: BreakStatement;
    constructor(breakStatement: BreakStatement, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap);
    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node;
}
