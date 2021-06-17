import { ArrayTypeName, FinderType, Node } from "@common/types";

export class ArrayTypeNameNode extends Node {
    astNode: ArrayTypeName;

    constructor (arrayTypeName: ArrayTypeName, uri: string) {
        super(arrayTypeName, uri);
        this.astNode = arrayTypeName;
    }

    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node {
        this.setExpressionNode(expression);

        const typeNode = find(this.astNode.baseTypeName, this.uri).accept(find, orphanNodes, parent, this);

        if (typeNode) {
            this.addTypeNode(typeNode);
        }

        return this;
    }
}
