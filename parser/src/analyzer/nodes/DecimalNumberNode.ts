import { DecimalNumber, FinderType, Node } from "@common/types";

export class DecimalNumberNode extends Node {
    astNode: DecimalNumber;

    constructor (decimalNumber: DecimalNumber, uri: string, rootPath: string) {
        super(decimalNumber, uri, rootPath);
        this.astNode = decimalNumber;
        // TO-DO: Implement name location for rename
    }

    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node {
        this.setExpressionNode(expression);
        // TO-DO: Method not implemented
        return this;
    }
}
