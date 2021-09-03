import { AssemblyLiteral, FinderType, DocumentsAnalyzerMap, Node } from "@common/types";
export declare class AssemblyLiteralNode extends Node {
    astNode: AssemblyLiteral;
    constructor(assemblyLiteral: AssemblyLiteral, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap);
    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node;
}
