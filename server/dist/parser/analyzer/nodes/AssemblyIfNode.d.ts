import { AssemblyIf, FinderType, DocumentsAnalyzerMap, Node } from "@common/types";
export declare class AssemblyIfNode extends Node {
    astNode: AssemblyIf;
    constructor(assemblyIf: AssemblyIf, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap);
    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node;
}
