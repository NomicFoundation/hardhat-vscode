import { UncheckedStatement, FinderType, DocumentsAnalyzerMap, Node } from "@common/types";
export declare class UncheckedStatementNode extends Node {
    astNode: UncheckedStatement;
    constructor(uncheckedStatement: UncheckedStatement, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap);
    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node;
}
