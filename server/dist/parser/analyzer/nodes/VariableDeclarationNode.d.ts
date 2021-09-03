import { VariableDeclaration, FinderType, Node, DocumentsAnalyzerMap, VariableDeclarationNode as IVariableDeclarationNode } from "@common/types";
export declare class VariableDeclarationNode extends IVariableDeclarationNode {
    astNode: VariableDeclaration;
    connectionTypeRules: string[];
    constructor(variableDeclaration: VariableDeclaration, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap);
    getDefinitionNode(): Node | undefined;
    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node;
    updateLocationName(typeNode: Node): void;
}
