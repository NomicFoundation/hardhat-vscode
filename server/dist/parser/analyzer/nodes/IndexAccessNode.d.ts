import { IndexAccess, FinderType, DocumentsAnalyzerMap, Node } from "@common/types";
export declare class IndexAccessNode extends Node {
    astNode: IndexAccess;
    constructor(indexAccess: IndexAccess, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap);
    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node;
}
