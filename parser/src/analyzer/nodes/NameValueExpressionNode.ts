import { NameValueExpression, FinderType, Node } from "@common/types";

export class NameValueExpressionNode extends Node {
    astNode: NameValueExpression;

    constructor (nameValueExpression: NameValueExpression, uri: string, rootPath: string) {
        super(nameValueExpression, uri, rootPath);
        this.astNode = nameValueExpression;
        // TO-DO: Implement name location for rename
    }

    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node {
        this.setExpressionNode(expression);
        // TO-DO: Method not implemented
        return this;
    }
}
