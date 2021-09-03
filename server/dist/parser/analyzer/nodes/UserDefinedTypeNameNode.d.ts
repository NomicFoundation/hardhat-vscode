import { UserDefinedTypeName, FinderType, DocumentsAnalyzerMap, Node } from "@common/types";
export declare class UserDefinedTypeNameNode extends Node {
    astNode: UserDefinedTypeName;
    constructor(userDefinedTypeName: UserDefinedTypeName, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap);
    setParent(parent: Node | undefined): void;
    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node;
    findMemberAccessParent(expressionNode: Node, definitionTypes: Node[]): void;
}
