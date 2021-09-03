import { UnaryOperation, FinderType, DocumentsAnalyzerMap, Node } from "@common/types";
export declare class UnaryOperationNode extends Node {
    astNode: UnaryOperation;
    constructor(unaryOperation: UnaryOperation, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap);
    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node;
}
