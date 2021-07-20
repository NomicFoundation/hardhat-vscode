import { ArrayTypeName, FinderType, DocumentsAnalyzerMap, Node } from "@common/types";

export class ArrayTypeNameNode extends Node {
    astNode: ArrayTypeName;

    constructor (arrayTypeName: ArrayTypeName, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap) {
        super(arrayTypeName, uri, rootPath, documentsAnalyzer, undefined);
        this.astNode = arrayTypeName;
    }

    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node {
        this.setExpressionNode(expression);

        const typeNode = find(this.astNode.baseTypeName, this.uri, this.rootPath, this.documentsAnalyzer).accept(find, orphanNodes, parent, this);

        if (typeNode) {
            this.addTypeNode(typeNode);
        }

        return this;
    }
}
