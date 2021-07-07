import { IndexAccess, FinderType, DocumentsAnalyzerMap, Node } from "@common/types";

export class IndexAccessNode extends Node {
    astNode: IndexAccess;

    constructor (indexAccess: IndexAccess, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap) {
        super(indexAccess, uri, rootPath, documentsAnalyzer, undefined);
        this.astNode = indexAccess;
    }

    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node {
        this.setExpressionNode(expression);

        const typeNode = find(this.astNode.base, this.uri, this.rootPath, this.documentsAnalyzer).accept(find, orphanNodes, parent, this);
        find(this.astNode.index, this.uri, this.rootPath, this.documentsAnalyzer).accept(find, orphanNodes, parent);

        return typeNode;
    }
}
