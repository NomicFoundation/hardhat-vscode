import { WhileStatement, FinderType, DocumentsAnalyzerMap, Node } from "@common/types";
export declare class WhileStatementNode extends Node {
    astNode: WhileStatement;
    constructor(whileStatement: WhileStatement, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap);
    getDefinitionNode(): Node | undefined;
    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node;
}
