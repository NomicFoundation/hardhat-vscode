import { StringLiteral, FinderType, Node } from "@common/types";

export class StringLiteralNode extends Node {
    astNode: StringLiteral;

    constructor (stringLiteral: StringLiteral, uri: string) {
        super(stringLiteral, uri);
        this.astNode = stringLiteral;
        // TO-DO: Implement name location for rename
    }

    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node {
        this.setExpressionNode(expression);
        // TO-DO: Method not implemented
        return this;
    }
}
