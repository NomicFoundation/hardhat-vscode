import { TupleExpression, FinderType, DocumentsAnalyzerMap, Node } from "@common/types";
export declare class TupleExpressionNode extends Node {
    astNode: TupleExpression;
    constructor(tupleExpression: TupleExpression, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap);
    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node;
}
