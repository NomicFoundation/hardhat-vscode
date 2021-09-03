import { ArrayTypeName, FinderType, DocumentsAnalyzerMap, Node } from "@common/types";
export declare class ArrayTypeNameNode extends Node {
    astNode: ArrayTypeName;
    constructor(arrayTypeName: ArrayTypeName, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap);
    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node;
}
