import { FunctionTypeName, FinderType, DocumentsAnalyzerMap, Node } from "@common/types";
export declare class FunctionTypeNameNode extends Node {
    astNode: FunctionTypeName;
    constructor(functionTypeName: FunctionTypeName, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap);
    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node;
}
