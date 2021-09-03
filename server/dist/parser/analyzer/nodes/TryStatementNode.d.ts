import { TryStatement, FinderType, DocumentsAnalyzerMap, Node } from "@common/types";
export declare class TryStatementNode extends Node {
    astNode: TryStatement;
    constructor(tryStatement: TryStatement, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap);
    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node;
}
