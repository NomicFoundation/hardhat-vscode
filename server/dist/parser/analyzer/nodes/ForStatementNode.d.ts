import { ForStatement, FinderType, DocumentsAnalyzerMap, Node } from "@common/types";
export declare class ForStatementNode extends Node {
    astNode: ForStatement;
    constructor(forStatement: ForStatement, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap);
    getDefinitionNode(): Node | undefined;
    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node;
}
