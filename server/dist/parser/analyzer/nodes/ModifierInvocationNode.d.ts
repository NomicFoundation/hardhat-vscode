import { ModifierInvocation, FinderType, DocumentsAnalyzerMap, Node } from "@common/types";
export declare class ModifierInvocationNode extends Node {
    astNode: ModifierInvocation;
    constructor(modifierInvocation: ModifierInvocation, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap);
    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node;
}
