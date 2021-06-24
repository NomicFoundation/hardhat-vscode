import { IndexAccess, FinderType, Node } from "@common/types";

export class IndexAccessNode extends Node {
    astNode: IndexAccess;

    constructor (indexAccess: IndexAccess, uri: string) {
        super(indexAccess, uri);
        this.astNode = indexAccess;
    }

    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node {
        this.setExpressionNode(expression);

        const typeNode = find(this.astNode.base, this.uri).accept(find, orphanNodes, parent, this);
        find(this.astNode.index, this.uri).accept(find, orphanNodes, parent);

        return typeNode;
    }
}
