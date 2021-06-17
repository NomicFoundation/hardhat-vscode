import { Break, FinderType, Node } from "@common/types";

export class BreakNode extends Node {
    astNode: Break;

    constructor (astBreak: Break, uri: string) {
        super(astBreak, uri);
        this.astNode = astBreak;
        // TO-DO: Implement name location for rename
    }

    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node {
        this.setExpressionNode(expression);
        // TO-DO: Method not implemented
        return this;
    }
}
