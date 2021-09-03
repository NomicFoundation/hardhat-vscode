import { ElementaryTypeName, FinderType, DocumentsAnalyzerMap, Node } from "@common/types";
export declare class ElementaryTypeNameNode extends Node {
    astNode: ElementaryTypeName;
    constructor(elementaryTypeName: ElementaryTypeName, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap);
    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node;
}
