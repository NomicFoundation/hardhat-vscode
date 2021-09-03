import { ContinueStatement, FinderType, DocumentsAnalyzerMap, Node } from "@common/types";
export declare class ContinueStatementNode extends Node {
    astNode: ContinueStatement;
    constructor(continueStatement: ContinueStatement, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap);
    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node;
}
