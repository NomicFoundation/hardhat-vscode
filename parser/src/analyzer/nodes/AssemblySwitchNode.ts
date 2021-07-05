import { AssemblySwitch, FinderType, Node } from "@common/types";

export class AssemblySwitchNode extends Node {
    astNode: AssemblySwitch;

    constructor (assemblySwitch: AssemblySwitch, uri: string, rootPath: string) {
        super(assemblySwitch, uri, rootPath);
        this.astNode = assemblySwitch;
    }

    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node {
        this.setExpressionNode(expression);

        if (parent) {
            this.setParent(parent);
        }

        find(this.astNode.expression, this.uri, this.rootPath).accept(find, orphanNodes, this);

        for (const caseNode of this.astNode.cases) {
            find(caseNode, this.uri, this.rootPath).accept(find, orphanNodes, this);
        }

        parent?.addChild(this);

        return this;
    }
}
