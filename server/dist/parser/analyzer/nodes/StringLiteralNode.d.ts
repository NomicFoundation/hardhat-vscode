import { StringLiteral, FinderType, DocumentsAnalyzerMap, Node } from "@common/types";
export declare class StringLiteralNode extends Node {
    astNode: StringLiteral;
    constructor(stringLiteral: StringLiteral, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap);
    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node;
}
