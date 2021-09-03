import { AssemblyAssignment, FinderType, DocumentsAnalyzerMap, Node } from "@common/types";
export declare class AssemblyAssignmentNode extends Node {
    astNode: AssemblyAssignment;
    constructor(assemblyAssignment: AssemblyAssignment, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap);
    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node;
}
