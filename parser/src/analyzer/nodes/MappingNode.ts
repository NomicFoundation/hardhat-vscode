import { Mapping, FinderType, Node } from "@common/types";

export class MappingNode extends Node {
    astNode: Mapping;

    constructor (mapping: Mapping, uri: string) {
        super(mapping, uri);
        this.astNode = mapping;
    }

    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node {
        this.setExpressionNode(expression);

        find(this.astNode.keyType, this.uri).accept(find, orphanNodes, parent);
        const typeNode = find(this.astNode.valueType, this.uri).accept(find, orphanNodes, parent);

        this.addTypeNode(typeNode);

        return this;
    }
}
