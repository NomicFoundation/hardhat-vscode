import { ImportDirective, FinderType, DocumentsAnalyzerMap, Node, ImportDirectiveNode as AbstractImportDirectiveNode } from "@common/types";
export declare class ImportDirectiveNode extends AbstractImportDirectiveNode {
    realUri: string;
    uri: string;
    astNode: ImportDirective;
    constructor(importDirective: ImportDirective, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap);
    getDefinitionNode(): Node | undefined;
    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node;
}
