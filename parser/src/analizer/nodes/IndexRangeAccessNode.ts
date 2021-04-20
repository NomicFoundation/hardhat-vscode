import { IndexRangeAccess } from "@solidity-parser/parser/dist/ast-types";

import { Location, FinderType, Node } from "./Node";

export class IndexRangeAccessNode implements Node {
    type: string;
    uri: string;
    astNode: IndexRangeAccess;

    nameLoc?: Location | undefined;

    parent?: Node | undefined;
    children: Node[] = [];

    constructor (indexRangeAccess: IndexRangeAccess, uri: string) {
        this.type = indexRangeAccess.type;
        this.uri = uri;
        this.astNode = indexRangeAccess;
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
