import { InheritanceSpecifier } from "@solidity-parser/parser/dist/ast-types";

import { Location, FinderType, Node } from "./Node";

export class InheritanceSpecifierNode implements Node {
    type: string;
    uri: string;
    astNode: InheritanceSpecifier;

    nameLoc?: Location | undefined;

    parent?: Node | undefined;
    children: Node[] = [];

    typeNodes: Node[] = [];

    constructor (inheritanceSpecifier: InheritanceSpecifier, uri: string) {
        this.type = inheritanceSpecifier.type;
        this.uri = uri;
        this.astNode = inheritanceSpecifier;
        // TO-DO: Implement name location for rename
    }

    getTypeNodes(): Node[] {
        return [];
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
