import { Continue, FinderType, Node } from "@common/types";

export class ContinueNode extends Node {
    astNode: Continue;

    constructor (astContinue: Continue, uri: string, rootPath: string) {
        super(astContinue, uri, rootPath);
        this.astNode = astContinue;
        // TO-DO: Implement name location for rename
    }

    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node {
        this.setExpressionNode(expression);
        // TO-DO: Method not implemented
        return this;
    }
}
