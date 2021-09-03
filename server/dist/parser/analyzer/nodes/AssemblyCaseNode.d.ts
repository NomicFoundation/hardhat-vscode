import { AssemblyCase, FinderType, DocumentsAnalyzerMap, Node } from "@common/types";
export declare class AssemblyCaseNode extends Node {
    astNode: AssemblyCase;
    constructor(assemblyCase: AssemblyCase, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap);
    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node;
}
