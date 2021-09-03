import { EnumValue, FinderType, DocumentsAnalyzerMap, Node } from "@common/types";
export declare class EnumValueNode extends Node {
    astNode: EnumValue;
    connectionTypeRules: string[];
    constructor(enumValue: EnumValue, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap);
    getDefinitionNode(): Node | undefined;
    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node;
}
