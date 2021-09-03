import { BooleanLiteral, FinderType, DocumentsAnalyzerMap, Node } from "@common/types";
export declare class BooleanLiteralNode extends Node {
    astNode: BooleanLiteral;
    constructor(booleanLiteral: BooleanLiteral, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap);
    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node;
}
