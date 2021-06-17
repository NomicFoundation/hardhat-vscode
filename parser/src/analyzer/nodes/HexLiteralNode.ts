import { HexLiteral, FinderType, Node } from "@common/types";

export class HexLiteralNode extends Node {
    astNode: HexLiteral;

    constructor (hexLiteral: HexLiteral, uri: string) {
        super(hexLiteral, uri);
        this.astNode = hexLiteral;
        // TO-DO: Implement name location for rename
    }

    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node {
        this.setExpressionNode(expression);
        // TO-DO: Method not implemented
        return this;
    }
}
