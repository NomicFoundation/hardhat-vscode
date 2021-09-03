import { UsingForDeclaration, FinderType, DocumentsAnalyzerMap, Node } from "@common/types";
export declare class UsingForDeclarationNode extends Node {
    astNode: UsingForDeclaration;
    connectionTypeRules: string[];
    constructor(usingForDeclaration: UsingForDeclaration, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap);
    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node;
}
