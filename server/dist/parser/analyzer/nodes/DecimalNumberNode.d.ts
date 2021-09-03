import { DecimalNumber, FinderType, DocumentsAnalyzerMap, Node } from "@common/types";
export declare class DecimalNumberNode extends Node {
    astNode: DecimalNumber;
    constructor(decimalNumber: DecimalNumber, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap);
    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node;
}
