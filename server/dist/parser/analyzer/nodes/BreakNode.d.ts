import { Break, FinderType, DocumentsAnalyzerMap, Node } from "@common/types";
export declare class BreakNode extends Node {
    astNode: Break;
    constructor(astBreak: Break, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap);
    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node;
}
