import { TupleExpression, FinderType, DocumentsAnalyzerMap, Node } from "@common/types";

export class TupleExpressionNode extends Node {
    astNode: TupleExpression;

    constructor (tupleExpression: TupleExpression, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap) {
        super(tupleExpression, uri, rootPath, documentsAnalyzer);
        this.astNode = tupleExpression;
    }

    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node {
        this.setExpressionNode(expression);

        for (const component of this.astNode.components) {
            if (component) {
                find(component, this.uri, this.rootPath, this.documentsAnalyzer).accept(find, orphanNodes, parent);
            }
        }

        return this;
    }
}
