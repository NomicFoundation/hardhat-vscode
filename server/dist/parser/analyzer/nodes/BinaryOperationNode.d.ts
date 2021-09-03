import { BinaryOperation, FinderType, DocumentsAnalyzerMap, Node } from "@common/types";
export declare class BinaryOperationNode extends Node {
    astNode: BinaryOperation;
    constructor(binaryOperation: BinaryOperation, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap);
    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node;
}
