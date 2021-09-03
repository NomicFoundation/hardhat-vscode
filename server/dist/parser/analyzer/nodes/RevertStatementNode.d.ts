import { RevertStatement, FinderType, DocumentsAnalyzerMap, Node } from "@common/types";
export declare class RevertStatementNode extends Node {
    astNode: RevertStatement;
    constructor(revertStatement: RevertStatement, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap);
    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node;
}
