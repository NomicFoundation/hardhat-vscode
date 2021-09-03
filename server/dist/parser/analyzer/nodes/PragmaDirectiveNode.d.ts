import { PragmaDirective, FinderType, DocumentsAnalyzerMap, Node } from "@common/types";
export declare class PragmaDirectiveNode extends Node {
    astNode: PragmaDirective;
    constructor(pragmaDirective: PragmaDirective, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap);
    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node;
}
