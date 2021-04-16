import { AssemblyIf } from "@solidity-parser/parser/dist/ast-types";

import { Location, FinderType, Node } from "./Node";

export class AssemblyIfNode implements Node {
    type: string;
    uri: string;
    astNode: AssemblyIf;

    nameLoc?: Location | undefined;

    parent?: Node | undefined;
    children: Node[] = [];

    constructor (assemblyIf: AssemblyIf, uri: string) {
        this.type = assemblyIf.type;
        this.uri = uri;
        this.astNode = assemblyIf;
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
