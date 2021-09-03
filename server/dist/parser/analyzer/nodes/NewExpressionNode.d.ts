import { NewExpression, FinderType, DocumentsAnalyzerMap, Node } from "@common/types";
export declare class NewExpressionNode extends Node {
    astNode: NewExpression;
    constructor(newExpression: NewExpression, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap);
    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node;
}
