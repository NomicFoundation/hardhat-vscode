import { EnumDefinition, FinderType, DocumentsAnalyzerMap, Node } from "@common/types";
export declare class EnumDefinitionNode extends Node {
    astNode: EnumDefinition;
    connectionTypeRules: string[];
    constructor(enumDefinition: EnumDefinition, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap);
    getTypeNodes(): Node[];
    getDefinitionNode(): Node | undefined;
    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node;
}
