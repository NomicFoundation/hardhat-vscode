import { LabelDefinition, FinderType, DocumentsAnalyzerMap, Node } from "@common/types";
export declare class LabelDefinitionNode extends Node {
    astNode: LabelDefinition;
    constructor(labelDefinition: LabelDefinition, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap);
    getTypeNodes(): Node[];
    getDefinitionNode(): Node | undefined;
    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node;
}
