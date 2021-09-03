import { FunctionCall, FinderType, DocumentsAnalyzerMap, Node } from "@common/types";
export declare class FunctionCallNode extends Node {
    astNode: FunctionCall;
    constructor(functionCall: FunctionCall, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap);
    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node;
}
