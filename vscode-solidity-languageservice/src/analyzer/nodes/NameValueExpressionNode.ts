import { NameValueExpression, FinderType, DocumentsAnalyzerMap, Node } from "@common/types";

export class NameValueExpressionNode extends Node {
    astNode: NameValueExpression;

    constructor (nameValueExpression: NameValueExpression, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap) {
        super(nameValueExpression, uri, rootPath, documentsAnalyzer, undefined);
        this.astNode = nameValueExpression;
        // TO-DO: Implement name location for rename
    }

    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node {
        this.setExpressionNode(expression);
        // TO-DO: Method not implemented
        return this;
    }
}
