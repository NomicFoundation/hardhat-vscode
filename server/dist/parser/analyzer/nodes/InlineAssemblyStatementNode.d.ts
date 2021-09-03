import { InlineAssemblyStatement, FinderType, DocumentsAnalyzerMap, Node } from "@common/types";
export declare class InlineAssemblyStatementNode extends Node {
    astNode: InlineAssemblyStatement;
    constructor(inlineAssemblyStatement: InlineAssemblyStatement, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap);
    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node;
}
