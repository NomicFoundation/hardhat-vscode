import { AssemblyBlock, FinderType, Node } from "@common/types";

export class AssemblyBlockNode extends Node {
    astNode: AssemblyBlock;

    constructor (assemblyBlock: AssemblyBlock, uri: string, rootPath: string) {
        super(assemblyBlock, uri, rootPath);
        this.astNode = assemblyBlock;
    }

    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node {
        this.setExpressionNode(expression);

        if (parent) {
            this.setParent(parent);
        }

        for (const operation of this.astNode.operations || []) {
            find(operation, this.uri, this.rootPath).accept(find, orphanNodes, this);
        }

        parent?.addChild(this);

        return this;
    }
}
