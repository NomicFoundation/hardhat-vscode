import { PragmaDirective, FinderType, Node } from "@common/types";

export class PragmaDirectiveNode extends Node {
    astNode: PragmaDirective;

    constructor (pragmaDirective: PragmaDirective, uri: string, rootPath: string) {
        super(pragmaDirective, uri, rootPath);
        this.astNode = pragmaDirective;
        // TO-DO: Implement name location for rename
    }

    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node {
        this.setExpressionNode(expression);
        // TO-DO: Method not implemented
        return this;
    }
}
