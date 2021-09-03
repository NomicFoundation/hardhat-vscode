import { IfStatement, FinderType, DocumentsAnalyzerMap, Node } from "@common/types";
export declare class IfStatementNode extends Node {
    astNode: IfStatement;
    constructor(ifStatement: IfStatement, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap);
    getDefinitionNode(): Node | undefined;
    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node;
}
