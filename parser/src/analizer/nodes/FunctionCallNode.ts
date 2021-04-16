import { FunctionCall } from "@solidity-parser/parser/dist/ast-types";

import { Location, FinderType, Node } from "./Node";

export class FunctionCallNode implements Node {
    type: string;
    uri: string;
    astNode: FunctionCall;

    nameLoc?: Location | undefined;

    parent?: Node | undefined;
    children: Node[] = [];

    constructor (functionCall: FunctionCall, uri: string) {
        this.type = functionCall.type;
        this.uri = uri;
        this.astNode = functionCall;
        // TO-DO: Implement name location for rename
    }

    addChild(child: Node): void {
        this.children.push(child);
    }

    setParent(parent: Node): void {
        this.parent = parent;
    }

    accept(find: FinderType, orphanNodes: Node[], parent?: Node): void {
        // TO-DO: Method not implemented
    }
}
