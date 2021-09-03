import { SourceUnit, FinderType, DocumentsAnalyzerMap, Node, SourceUnitNode as AbstractSourceUnitNode } from "@common/types";
export declare class SourceUnitNode extends AbstractSourceUnitNode {
    astNode: SourceUnit;
    constructor(sourceUnit: SourceUnit, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap);
    getDefinitionNode(): Node | undefined;
    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node;
}
