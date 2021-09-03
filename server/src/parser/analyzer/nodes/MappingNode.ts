import { Mapping, FinderType, DocumentsAnalyzerMap, Node } from "@common/types";

export class MappingNode extends Node {
    astNode: Mapping;

    constructor (mapping: Mapping, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap) {
        super(mapping, uri, rootPath, documentsAnalyzer, undefined);
        this.astNode = mapping;
    }

    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node {
        this.setExpressionNode(expression);

        find(this.astNode.keyType, this.uri, this.rootPath, this.documentsAnalyzer).accept(find, orphanNodes, parent);
        const typeNode = find(this.astNode.valueType, this.uri, this.rootPath, this.documentsAnalyzer).accept(find, orphanNodes, parent);

        this.addTypeNode(typeNode);

        return this;
    }
}
