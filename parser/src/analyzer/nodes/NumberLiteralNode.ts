import { NumberLiteral, FinderType, DocumentsAnalyzerMap, Node } from "@common/types";

export class NumberLiteralNode extends Node {
    astNode: NumberLiteral;

    constructor (numberLiteral: NumberLiteral, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap) {
        super(numberLiteral, uri, rootPath, documentsAnalyzer, undefined);
        this.astNode = numberLiteral;
        // TO-DO: Implement name location for rename
    }

    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node {
        this.setExpressionNode(expression);
        // TO-DO: Method not implemented
        return this;
    }
}
