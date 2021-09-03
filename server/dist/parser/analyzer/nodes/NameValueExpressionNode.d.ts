import { NameValueExpression, FinderType, DocumentsAnalyzerMap, Node } from "@common/types";
export declare class NameValueExpressionNode extends Node {
    astNode: NameValueExpression;
    constructor(nameValueExpression: NameValueExpression, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap);
    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node;
}
