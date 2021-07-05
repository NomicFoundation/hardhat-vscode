import { FunctionCall, FinderType, Node } from "@common/types";

export class FunctionCallNode extends Node {
    astNode: FunctionCall;

    constructor (functionCall: FunctionCall, uri: string, rootPath: string) {
        super(functionCall, uri, rootPath);
        this.astNode = functionCall;
    }

    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node {
        this.setExpressionNode(expression);

        if (expression?.type !== "EmitStatement") {
            expression = this;
        }

        const expressionNode = find(this.astNode.expression, this.uri, this.rootPath).accept(find, orphanNodes, parent, expression);

        for (const argument of this.astNode.arguments) {
            find(argument, this.uri, this.rootPath).accept(find, orphanNodes, parent);
        }

        return expressionNode;
    }
}
