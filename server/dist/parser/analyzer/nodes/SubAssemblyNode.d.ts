import { SubAssembly, FinderType, DocumentsAnalyzerMap, Node } from "@common/types";
export declare class SubAssemblyNode extends Node {
    astNode: SubAssembly;
    constructor(subAssembly: SubAssembly, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap);
    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node;
}
