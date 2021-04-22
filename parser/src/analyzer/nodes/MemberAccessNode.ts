import { MemberAccess } from "@solidity-parser/parser/dist/ast-types";

import { Location, FinderType, Node } from "./Node";

export class MemberAccessNode implements Node {
    type: string;
    uri: string;
    astNode: MemberAccess;

    nameLoc?: Location | undefined;

    parent?: Node | undefined;
    children: Node[] = [];

    constructor (memberAccess: MemberAccess, uri: string) {
        this.type = memberAccess.type;
        this.uri = uri;
        this.astNode = memberAccess;
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

    accept(find: FinderType, orphanNodes: Node[], parent?: Node): Node {
        // TO-DO: Method not implemented
        find(this.astNode.expression, this.uri).accept(find, orphanNodes, parent);

        return this;
    }
}
