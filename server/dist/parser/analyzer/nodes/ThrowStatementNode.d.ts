import { ThrowStatement, FinderType, DocumentsAnalyzerMap, Node } from "@common/types";
export declare class ThrowStatementNode extends Node {
    astNode: ThrowStatement;
    constructor(throwStatement: ThrowStatement, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap);
    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node;
}
