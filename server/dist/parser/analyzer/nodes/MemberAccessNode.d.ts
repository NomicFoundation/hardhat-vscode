import { MemberAccess, FinderType, DocumentsAnalyzerMap, Node, MemberAccessNode as IMemberAccessNode } from "@common/types";
export declare class MemberAccessNode extends IMemberAccessNode {
    astNode: MemberAccess;
    constructor(memberAccess: MemberAccess, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap);
    setParent(parent: Node | undefined): void;
    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node;
    findMemberAccessParent(expressionNode: Node, definitionTypes: Node[]): Node | undefined;
}
