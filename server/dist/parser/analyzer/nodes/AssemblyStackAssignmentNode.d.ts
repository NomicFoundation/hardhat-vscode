import { AssemblyStackAssignment, FinderType, DocumentsAnalyzerMap, Node } from "@common/types";
export declare class AssemblyStackAssignmentNode extends Node {
    astNode: AssemblyStackAssignment;
    constructor(assemblyStackAssignment: AssemblyStackAssignment, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap);
    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node;
}
