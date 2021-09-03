import { Block, FinderType, DocumentsAnalyzerMap, Node } from "@common/types";
export declare class BlockNode extends Node {
    astNode: Block;
    constructor(block: Block, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap);
    getDefinitionNode(): Node | undefined;
    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node;
}
