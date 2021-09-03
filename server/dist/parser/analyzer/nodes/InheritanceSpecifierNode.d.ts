import { InheritanceSpecifier, FinderType, DocumentsAnalyzerMap, Node } from "@common/types";
export declare class InheritanceSpecifierNode extends Node {
    astNode: InheritanceSpecifier;
    constructor(inheritanceSpecifier: InheritanceSpecifier, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap);
    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node;
}
