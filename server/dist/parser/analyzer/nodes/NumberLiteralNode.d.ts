import { NumberLiteral, FinderType, DocumentsAnalyzerMap, Node } from "@common/types";
export declare class NumberLiteralNode extends Node {
    astNode: NumberLiteral;
    constructor(numberLiteral: NumberLiteral, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap);
    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node;
}
