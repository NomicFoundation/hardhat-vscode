import { DoWhileStatement, FinderType, DocumentsAnalyzerMap, Node } from "@common/types";
export declare class DoWhileStatementNode extends Node {
    astNode: DoWhileStatement;
    constructor(doWhileStatement: DoWhileStatement, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap);
    getDefinitionNode(): Node | undefined;
    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node;
}
