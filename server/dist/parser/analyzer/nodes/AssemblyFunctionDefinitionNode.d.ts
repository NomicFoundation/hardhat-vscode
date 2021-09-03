import { AssemblyFunctionDefinition, FinderType, DocumentsAnalyzerMap, Node } from "@common/types";
export declare class AssemblyFunctionDefinitionNode extends Node {
    astNode: AssemblyFunctionDefinition;
    connectionTypeRules: string[];
    constructor(assemblyFunctionDefinition: AssemblyFunctionDefinition, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap);
    getDefinitionNode(): Node | undefined;
    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node;
    private findChildren;
}
