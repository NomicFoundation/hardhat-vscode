import { AssemblyLocalDefinition, FinderType, DocumentsAnalyzerMap, Node } from "@common/types";
export declare class AssemblyLocalDefinitionNode extends Node {
    astNode: AssemblyLocalDefinition;
    connectionTypeRules: string[];
    constructor(assemblyLocalDefinition: AssemblyLocalDefinition, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap, parent?: Node, identifierNode?: Node);
    getTypeNodes(): Node[];
    getDefinitionNode(): Node | undefined;
    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node;
}
