import { FunctionCall } from "@solidity-parser/parser/dist/src/ast-types";

import { Location, FinderType, Node, Position } from "./Node";

export class FunctionCallNode implements Node {
    type: string;
    uri: string;
    astNode: FunctionCall;

    nameLoc?: Location | undefined;

    expressionNode?: Node | undefined;

    connectionTypeRules: string[] = [];

    parent?: Node | undefined;
    children: Node[] = [];

    typeNodes: Node[] = [];

    constructor (functionCall: FunctionCall, uri: string) {
        this.type = functionCall.type;
        this.uri = uri;
        this.astNode = functionCall;
    }

    getTypeNodes(): Node[] {
        return this.typeNodes;
    }

    addTypeNode(node: Node): void {
        this.typeNodes.push(node);
    }

    getExpressionNode(): Node | undefined {
        return this.expressionNode;
    }

    setExpressionNode(node: Node | undefined): void {
        this.expressionNode = node;
    }

    getDefinitionNode(): Node | undefined {
        // TO-DO: Method not implemented
        return undefined;
    }

    getName(): string | undefined {
        return undefined;
    }

    addChild(child: Node): void {
        this.children.push(child);
    }

    setParent(parent: Node | undefined): void {
        this.parent = parent;
    }

    getParent(): Node | undefined {
        return this.parent;
    }

    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node {
        this.setExpressionNode(expression);

        find(this.astNode.expression, this.uri).accept(find, orphanNodes, parent, this);

        for (const argument of this.astNode.arguments) {
            find(argument, this.uri).accept(find, orphanNodes, parent);
        }

        return this;
    }
}
