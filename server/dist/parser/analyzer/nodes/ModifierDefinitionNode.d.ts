import { ModifierDefinition, FinderType, DocumentsAnalyzerMap, Node } from "@common/types";
export declare class ModifierDefinitionNode extends Node {
    astNode: ModifierDefinition;
    connectionTypeRules: string[];
    constructor(modifierDefinition: ModifierDefinition, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap);
    getTypeNodes(): Node[];
    getDefinitionNode(): Node | undefined;
    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node;
}
