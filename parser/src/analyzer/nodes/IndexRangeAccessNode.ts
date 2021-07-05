import { IndexRangeAccess, FinderType, DocumentsAnalyzerMap, Node } from "@common/types";

export class IndexRangeAccessNode extends Node {
    astNode: IndexRangeAccess;

    constructor (indexRangeAccess: IndexRangeAccess, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap) {
        super(indexRangeAccess, uri, rootPath, documentsAnalyzer);
        this.astNode = indexRangeAccess;
    }

    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node {
        this.setExpressionNode(expression);

        const typeNode = find(this.astNode.base, this.uri, this.rootPath, this.documentsAnalyzer).accept(find, orphanNodes, parent, this);

        if (this.astNode.indexStart) {
            find(this.astNode.indexStart, this.uri, this.rootPath, this.documentsAnalyzer).accept(find, orphanNodes, parent);
        }

        if (this.astNode.indexEnd) {
            find(this.astNode.indexEnd, this.uri, this.rootPath, this.documentsAnalyzer).accept(find, orphanNodes, parent);
        }

        return typeNode;
    }
}
