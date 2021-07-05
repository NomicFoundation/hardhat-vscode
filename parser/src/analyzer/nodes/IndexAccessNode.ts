import { IndexAccess, FinderType, Node } from "@common/types";

export class IndexAccessNode extends Node {
    astNode: IndexAccess;

    constructor (indexAccess: IndexAccess, uri: string, rootPath: string) {
        super(indexAccess, uri, rootPath);
        this.astNode = indexAccess;
    }

    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node {
        this.setExpressionNode(expression);

        const typeNode = find(this.astNode.base, this.uri, this.rootPath).accept(find, orphanNodes, parent, this);
        find(this.astNode.index, this.uri, this.rootPath).accept(find, orphanNodes, parent);

        return typeNode;
    }
}
