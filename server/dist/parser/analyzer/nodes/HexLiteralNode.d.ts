import { HexLiteral, FinderType, DocumentsAnalyzerMap, Node } from "@common/types";
export declare class HexLiteralNode extends Node {
    astNode: HexLiteral;
    constructor(hexLiteral: HexLiteral, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap);
    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node;
}
