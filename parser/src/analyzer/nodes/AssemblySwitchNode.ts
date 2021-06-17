import { AssemblySwitch, FinderType, Node } from "@common/types";

export class AssemblySwitchNode extends Node {
    astNode: AssemblySwitch;

    constructor (assemblySwitch: AssemblySwitch, uri: string) {
        super(assemblySwitch, uri);
        this.astNode = assemblySwitch;
    }

    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node {
        this.setExpressionNode(expression);

        if (parent) {
            this.setParent(parent);
        }

        find(this.astNode.expression, this.uri).accept(find, orphanNodes, this);

        for (const caseNode of this.astNode.cases) {
            find(caseNode, this.uri).accept(find, orphanNodes, this);
        }

        parent?.addChild(this);

        return this;
    }
}
