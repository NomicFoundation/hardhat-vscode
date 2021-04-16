import { SubAssembly } from "@solidity-parser/parser/dist/ast-types";

import { Location, FinderType, Node } from "./Node";

export class SubAssemblyNode implements Node {
    type: string;
    uri: string;
    astNode: SubAssembly;

    nameLoc?: Location | undefined;

    parent?: Node | undefined;
    children: Node[] = [];

    constructor (subAssembly: SubAssembly, uri: string) {
        this.type = subAssembly.type;
        this.uri = uri;
        this.astNode = subAssembly;
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
