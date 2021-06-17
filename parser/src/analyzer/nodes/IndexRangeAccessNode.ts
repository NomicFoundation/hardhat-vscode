import { IndexRangeAccess, FinderType, Node } from "@common/types";

export class IndexRangeAccessNode extends Node {
    astNode: IndexRangeAccess;

    constructor (indexRangeAccess: IndexRangeAccess, uri: string) {
        super(indexRangeAccess, uri);
        this.astNode = indexRangeAccess;
    }

    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node {
        this.setExpressionNode(expression);

        if (this.astNode.base) {
            find(this.astNode.base, this.uri).accept(find, orphanNodes, parent);
        }

        if (this.astNode.indexStart) {
            find(this.astNode.indexStart, this.uri).accept(find, orphanNodes, parent);
        }

        if (this.astNode.indexEnd) {
            find(this.astNode.indexEnd, this.uri).accept(find, orphanNodes, parent);
        }

        return this;
    }
}
