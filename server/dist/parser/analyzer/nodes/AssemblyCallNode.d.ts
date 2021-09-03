import { AssemblyCall, FinderType, DocumentsAnalyzerMap, Node } from "@common/types";
export declare class AssemblyCallNode extends Node {
    astNode: AssemblyCall;
    constructor(assemblyCall: AssemblyCall, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap);
    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node;
}
