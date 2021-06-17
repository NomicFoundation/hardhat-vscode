import { AssemblyIf, FinderType, Node } from "@common/types";

export class AssemblyIfNode extends Node {
    astNode: AssemblyIf;

    constructor (assemblyIf: AssemblyIf, uri: string) {
        super(assemblyIf, uri);
        this.astNode = assemblyIf;
    }

    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node {
        this.setExpressionNode(expression);

        if (parent) {
            this.setParent(parent);
        }

        find(this.astNode.condition, this.uri).accept(find, orphanNodes, this);
        
        find(this.astNode.body, this.uri).accept(find, orphanNodes, this);

        parent?.addChild(this);

        return this;
    }
}
