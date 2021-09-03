import { TypeNameExpression, FinderType, DocumentsAnalyzerMap, Node } from "@common/types";
export declare class TypeNameExpressionNode extends Node {
    astNode: TypeNameExpression;
    constructor(typeNameExpression: TypeNameExpression, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap);
    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node;
}
