import { Identifier, FinderType, DocumentsAnalyzerMap, Node } from "@common/types";
export declare class IdentifierNode extends Node {
    astNode: Identifier;
    constructor(identifier: Identifier, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap);
    setParent(parent: Node | undefined): void;
    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node;
    findMemberAccessParent(expressionNode: Node, definitionTypes: Node[]): void;
}
