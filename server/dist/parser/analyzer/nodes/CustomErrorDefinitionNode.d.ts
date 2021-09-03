import { CustomErrorDefinition, FinderType, DocumentsAnalyzerMap, Node } from "@common/types";
export declare class CustomErrorDefinitionNode extends Node {
    astNode: CustomErrorDefinition;
    constructor(customErrorDefinition: CustomErrorDefinition, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap);
    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node;
}
