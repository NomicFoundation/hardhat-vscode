import { Conditional, FinderType, DocumentsAnalyzerMap, Node } from "@common/types";
export declare class ConditionalNode extends Node {
    astNode: Conditional;
    constructor(conditional: Conditional, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap);
    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node;
}
