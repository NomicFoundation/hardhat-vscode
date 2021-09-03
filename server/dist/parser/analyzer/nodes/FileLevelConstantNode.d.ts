import { FileLevelConstant, FinderType, DocumentsAnalyzerMap, Node } from "@common/types";
export declare class FileLevelConstantNode extends Node {
    astNode: FileLevelConstant;
    connectionTypeRules: string[];
    constructor(fileLevelConstant: FileLevelConstant, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap);
    getDefinitionNode(): Node | undefined;
    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node;
    updateLocationName(typeNode: Node): void;
}
