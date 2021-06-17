import { AssemblyStackAssignment, FinderType, Node } from "@common/types";

export class AssemblyStackAssignmentNode extends Node {
    astNode: AssemblyStackAssignment;

    constructor (assemblyStackAssignment: AssemblyStackAssignment, uri: string) {
        super(assemblyStackAssignment, uri);
        this.astNode = assemblyStackAssignment;
        // TO-DO: Implement name location for rename
    }

    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node {
        this.setExpressionNode(expression);
        // TO-DO: Method not implemented
        return this;
    }
}
