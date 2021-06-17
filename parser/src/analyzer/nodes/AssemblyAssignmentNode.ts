import { AssemblyAssignment, FinderType, Node } from "@common/types";

export class AssemblyAssignmentNode extends Node {
    astNode: AssemblyAssignment;

    constructor (assemblyAssignment: AssemblyAssignment, uri: string) {
        super(assemblyAssignment, uri);
        this.astNode = assemblyAssignment;
    }

    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node {
        this.setExpressionNode(expression);

        for (const name of this.astNode.names || []) {
            find(name, this.uri).accept(find, orphanNodes, parent);
        }

        if (this.astNode.expression) {
            find(this.astNode.expression, this.uri).accept(find, orphanNodes, parent);
        }

        return this;
    }
}
