import { IndexRangeAccess, FinderType, DocumentsAnalyzerMap, Node } from "@common/types";
export declare class IndexRangeAccessNode extends Node {
    astNode: IndexRangeAccess;
    constructor(indexRangeAccess: IndexRangeAccess, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap);
    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node;
}
