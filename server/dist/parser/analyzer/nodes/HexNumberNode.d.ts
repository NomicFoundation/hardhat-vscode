import { HexNumber, FinderType, DocumentsAnalyzerMap, Node } from "@common/types";
export declare class HexNumberNode extends Node {
    astNode: HexNumber;
    constructor(hexNumber: HexNumber, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap);
    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node;
}
