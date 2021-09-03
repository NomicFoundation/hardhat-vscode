import { AssemblyBlock, FinderType, DocumentsAnalyzerMap, Node } from "@common/types";
export declare class AssemblyBlockNode extends Node {
    astNode: AssemblyBlock;
    constructor(assemblyBlock: AssemblyBlock, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap);
    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node;
}
