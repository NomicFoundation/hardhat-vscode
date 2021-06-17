import { HexNumber, FinderType, Node } from "@common/types";

export class HexNumberNode extends Node {
    astNode: HexNumber;

    constructor (hexNumber: HexNumber, uri: string) {
        super(hexNumber, uri);
        this.astNode = hexNumber;
        // TO-DO: Implement name location for rename
    }

    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node {
        this.setExpressionNode(expression);
        // TO-DO: Method not implemented
        return this;
    }
}
