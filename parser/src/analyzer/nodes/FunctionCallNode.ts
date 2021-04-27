import { FunctionCall } from "@solidity-parser/parser/dist/src/ast-types";

import { Location, FinderType, Node } from "./Node";

export class FunctionCallNode implements Node {
    type: string;
    uri: string;
    astNode: FunctionCall;

    nameLoc?: Location | undefined;

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

    getName(): string | undefined {
        return undefined;
    }

    addChild(child: Node): void {
        this.children.push(child);
    }

    setParent(parent: Node): void {
        this.parent = parent;
    }

    accept(find: FinderType, orphanNodes: Node[], parent?: Node): Node {
        // TO-DO: Implement references for expression name nodes
        find(this.astNode.expression, this.uri).accept(find, orphanNodes, parent);

        for (const argument of this.astNode.arguments) {
            find(argument, this.uri).accept(find, orphanNodes, parent);
        }

        return this;
    }
}
