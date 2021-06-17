import { FunctionTypeName, FinderType, Node } from "@common/types";

export class FunctionTypeNameNode extends Node {
    astNode: FunctionTypeName;

    constructor (functionTypeName: FunctionTypeName, uri: string) {
        super(functionTypeName, uri);
        this.astNode = functionTypeName;
        // TO-DO: Implement name location for rename
    }

    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node {
        this.setExpressionNode(expression);
        // TO-DO: Method not implemented
        return this;
    }
}
