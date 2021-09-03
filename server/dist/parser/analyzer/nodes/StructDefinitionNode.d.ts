import { StructDefinition, FinderType, DocumentsAnalyzerMap, Node } from "@common/types";
export declare class StructDefinitionNode extends Node {
    astNode: StructDefinition;
    connectionTypeRules: string[];
    constructor(structDefinition: StructDefinition, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap);
    getTypeNodes(): Node[];
    getDefinitionNode(): Node | undefined;
    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node;
}
