import { AssemblyFunctionReturns } from "@solidity-parser/parser/dist/ast-types";

import { Location, FinderType, Node } from "./Node";

export class AssemblyFunctionReturnsNode implements Node {
    type: string;
    uri: string;
    astNode: AssemblyFunctionReturns;

    nameLoc?: Location | undefined;

    parent?: Node | undefined;
    children: Node[] = [];

    typeNodes: Node[] = [];

    constructor (assemblyFunctionReturns: AssemblyFunctionReturns, uri: string) {
        this.type = assemblyFunctionReturns.type;
        this.uri = uri;
        this.astNode = assemblyFunctionReturns;
        // TO-DO: Implement name location for rename
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
        // TO-DO: Method not implemented
        return this;
    }
}
