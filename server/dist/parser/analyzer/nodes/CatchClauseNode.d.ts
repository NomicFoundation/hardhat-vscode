import { CatchClause, FinderType, DocumentsAnalyzerMap, Node } from "@common/types";
export declare class CatchClauseNode extends Node {
    astNode: CatchClause;
    constructor(catchClause: CatchClause, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap);
    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node;
}
