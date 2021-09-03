import { EmitStatement, FinderType, DocumentsAnalyzerMap, Node } from "@common/types";
export declare class EmitStatementNode extends Node {
    astNode: EmitStatement;
    constructor(emitStatement: EmitStatement, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap);
    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node;
}
