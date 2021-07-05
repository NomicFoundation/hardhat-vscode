import { AssemblyFor, FinderType, Node } from "@common/types";

export class AssemblyForNode extends Node {
    astNode: AssemblyFor;

    constructor (assemblyFor: AssemblyFor, uri: string, rootPath: string) {
        super(assemblyFor, uri, rootPath);
        this.astNode = assemblyFor;
    }

    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node {
        this.setExpressionNode(expression);

        if (parent) {
            this.setParent(parent);
        }

        find(this.astNode.pre, this.uri, this.rootPath).accept(find, orphanNodes, this);
        find(this.astNode.condition, this.uri, this.rootPath).accept(find, orphanNodes, this);
        find(this.astNode.post, this.uri, this.rootPath).accept(find, orphanNodes, this);
        find(this.astNode.body, this.uri, this.rootPath).accept(find, orphanNodes, this);

        parent?.addChild(this);

        return this;
    }
}
