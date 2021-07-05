import { AssemblyMemberAccess, FinderType, Node } from "@common/types";

export class AssemblyMemberAccessNode extends Node {
    astNode: AssemblyMemberAccess;

    constructor (assemblyMemberAccess: AssemblyMemberAccess, uri: string, rootPath: string) {
        super(assemblyMemberAccess, uri, rootPath);
        this.astNode = assemblyMemberAccess;
        // TO-DO: Implement name location for rename
    }

    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node {
        this.setExpressionNode(expression);
        // TO-DO: Method not implemented
        return this;
    }
}
