import { AssemblyMemberAccess, FinderType, DocumentsAnalyzerMap, Node } from "@common/types";
export declare class AssemblyMemberAccessNode extends Node {
    astNode: AssemblyMemberAccess;
    constructor(assemblyMemberAccess: AssemblyMemberAccess, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap);
    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node;
}
