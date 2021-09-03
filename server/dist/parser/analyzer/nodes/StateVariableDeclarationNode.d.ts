import { StateVariableDeclaration, FinderType, DocumentsAnalyzerMap, Node } from "@common/types";
export declare class StateVariableDeclarationNode extends Node {
    astNode: StateVariableDeclaration;
    constructor(stateVariableDeclaration: StateVariableDeclaration, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap);
    getDefinitionNode(): Node | undefined;
    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node;
}
