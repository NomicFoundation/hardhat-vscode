import { AssemblyFunctionReturns, FinderType, Node } from "@common/types";

export class AssemblyFunctionReturnsNode extends Node {
    astNode: AssemblyFunctionReturns;

    constructor (assemblyFunctionReturns: AssemblyFunctionReturns, uri: string, rootPath: string) {
        super(assemblyFunctionReturns, uri, rootPath);
        this.astNode = assemblyFunctionReturns;
        // TO-DO: Implement name location for rename
    }

    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node {
        this.setExpressionNode(expression);
        // TO-DO: Method not implemented
        return this;
    }
}
