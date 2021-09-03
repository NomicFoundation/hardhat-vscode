import { EventDefinition, FinderType, DocumentsAnalyzerMap, Node } from "@common/types";
export declare class EventDefinitionNode extends Node {
    astNode: EventDefinition;
    connectionTypeRules: string[];
    constructor(eventDefinition: EventDefinition, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap);
    getTypeNodes(): Node[];
    getDefinitionNode(): Node | undefined;
    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node;
}
