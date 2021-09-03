import { VariableDeclarationStatement, FinderType, DocumentsAnalyzerMap, Node } from "@common/types";
export declare class VariableDeclarationStatementNode extends Node {
    astNode: VariableDeclarationStatement;
    constructor(variableDeclarationStatement: VariableDeclarationStatement, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap);
    getDefinitionNode(): Node | undefined;
    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node;
}
