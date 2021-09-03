import { AssemblyFor, FinderType, DocumentsAnalyzerMap, Node } from "@common/types";
export declare class AssemblyForNode extends Node {
    astNode: AssemblyFor;
    constructor(assemblyFor: AssemblyFor, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap);
    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node;
}
