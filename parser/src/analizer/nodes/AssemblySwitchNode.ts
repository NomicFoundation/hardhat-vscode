import { AssemblySwitch } from "@solidity-parser/parser/dist/ast-types";

import { Location, FinderType, Node } from "./Node";

export class AssemblySwitchNode implements Node {
    type: string;
    uri: string;
    astNode: AssemblySwitch;

    nameLoc?: Location | undefined;

    parent?: Node | undefined;
    children: Node[] = [];

    constructor (assemblySwitch: AssemblySwitch, uri: string) {
        this.type = assemblySwitch.type;
        this.uri = uri;
        this.astNode = assemblySwitch;
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
