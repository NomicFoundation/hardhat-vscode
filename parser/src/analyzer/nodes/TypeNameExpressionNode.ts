import { TypeNameExpression, FinderType, Node } from "@common/types";

export class TypeNameExpressionNode extends Node {
    astNode: TypeNameExpression;

    constructor (typeNameExpression: TypeNameExpression, uri: string, rootPath: string) {
        super(typeNameExpression, uri, rootPath);
        this.astNode = typeNameExpression;
        // TO-DO: Implement name location for rename
    }

    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node {
        this.setExpressionNode(expression);
        // TO-DO: Method not implemented
        return this;
    }
}
