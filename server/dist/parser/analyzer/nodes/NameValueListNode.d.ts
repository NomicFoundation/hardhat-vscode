import { NameValueList, FinderType, DocumentsAnalyzerMap, Node } from "@common/types";
export declare class NameValueListNode extends Node {
    astNode: NameValueList;
    constructor(nameValueList: NameValueList, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap);
    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node;
}
