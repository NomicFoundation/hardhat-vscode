import { BooleanLiteral, FinderType, Node } from "@common/types";

export class BooleanLiteralNode extends Node {
    astNode: BooleanLiteral;

    constructor (booleanLiteral: BooleanLiteral, uri: string, rootPath: string) {
        super(booleanLiteral, uri, rootPath);
        this.astNode = booleanLiteral;
        // TO-DO: Implement name location for rename
    }

    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node {
        this.setExpressionNode(expression);
        // TO-DO: Method not implemented
        return this;
    }
}
