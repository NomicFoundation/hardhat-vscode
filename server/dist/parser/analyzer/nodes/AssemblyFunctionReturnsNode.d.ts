import { AssemblyFunctionReturns, FinderType, DocumentsAnalyzerMap, Node } from "@common/types";
export declare class AssemblyFunctionReturnsNode extends Node {
    astNode: AssemblyFunctionReturns;
    constructor(assemblyFunctionReturns: AssemblyFunctionReturns, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap);
    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node;
}
