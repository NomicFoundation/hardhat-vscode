import { ReturnStatement, FinderType, DocumentsAnalyzerMap, Node } from "@common/types";
export declare class ReturnStatementNode extends Node {
    astNode: ReturnStatement;
    constructor(returnStatement: ReturnStatement, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap);
    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node;
}
