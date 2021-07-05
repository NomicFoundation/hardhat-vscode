import { AssemblyLiteral, FinderType, Node } from "@common/types";

export class AssemblyLiteralNode extends Node {
    astNode: AssemblyLiteral;

    constructor (assemblyLiteral: AssemblyLiteral, uri: string, rootPath: string) {
        super(assemblyLiteral, uri, rootPath);
        this.astNode = assemblyLiteral;
        // TO-DO: Implement name location for rename
    }

    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node {
        this.setExpressionNode(expression);
        // TO-DO: Method not implemented
        return this;
    }
}
