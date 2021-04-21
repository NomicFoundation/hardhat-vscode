import { AssemblyCall } from "@solidity-parser/parser/dist/ast-types";

import { Location, FinderType, Node } from "./Node";

export class AssemblyCallNode implements Node {
    type: string;
    uri: string;
    astNode: AssemblyCall;

    nameLoc?: Location | undefined;

    parent?: Node | undefined;
    children: Node[] = [];

    constructor (assemblyCall: AssemblyCall, uri: string) {
        this.type = assemblyCall.type;
        this.uri = uri;
        this.astNode = assemblyCall;
        // TO-DO: Implement name location for rename
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

    accept(find: FinderType, orphanNodes: Node[], parent?: Node): void {
        // TO-DO: Method not implemented
    }
}
