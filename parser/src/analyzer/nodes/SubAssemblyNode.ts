import { SubAssembly, FinderType, Node } from "@common/types";

export class SubAssemblyNode extends Node {
    astNode: SubAssembly;

    constructor (subAssembly: SubAssembly, uri: string, rootPath: string) {
        super(subAssembly, uri, rootPath);
        this.astNode = subAssembly;
        // TO-DO: Implement name location for rename
    }

    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node {
        this.setExpressionNode(expression);
        // TO-DO: Method not implemented
        return this;
    }
}
