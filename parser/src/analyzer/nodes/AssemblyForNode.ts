import { AssemblyFor, FinderType, Node } from "@common/types";

export class AssemblyForNode extends Node {
    astNode: AssemblyFor;

    constructor (assemblyFor: AssemblyFor, uri: string) {
        super(assemblyFor, uri);
        this.astNode = assemblyFor;
    }

    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node {
        this.setExpressionNode(expression);

        if (parent) {
            this.setParent(parent);
        }

        find(this.astNode.pre, this.uri).accept(find, orphanNodes, this);
        find(this.astNode.condition, this.uri).accept(find, orphanNodes, this);
        find(this.astNode.post, this.uri).accept(find, orphanNodes, this);
        find(this.astNode.body, this.uri).accept(find, orphanNodes, this);

        parent?.addChild(this);

        return this;
    }
}
