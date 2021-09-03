import { Continue, FinderType, DocumentsAnalyzerMap, Node } from "@common/types";
export declare class ContinueNode extends Node {
    astNode: Continue;
    constructor(astContinue: Continue, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap);
    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node;
}
