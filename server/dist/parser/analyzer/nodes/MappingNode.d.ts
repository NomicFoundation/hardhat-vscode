import { Mapping, FinderType, DocumentsAnalyzerMap, Node } from "@common/types";
export declare class MappingNode extends Node {
    astNode: Mapping;
    constructor(mapping: Mapping, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap);
    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node;
}
