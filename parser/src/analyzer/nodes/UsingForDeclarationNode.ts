import { UsingForDeclaration } from "@solidity-parser/parser/dist/ast-types";

import { Location, FinderType, Node } from "./Node";

export class UsingForDeclarationNode implements Node {
    type: string;
    uri: string;
    astNode: UsingForDeclaration;

    nameLoc?: Location | undefined;

    parent?: Node | undefined;
    children: Node[] = [];

    constructor (usingForDeclaration: UsingForDeclaration, uri: string) {
        this.type = usingForDeclaration.type;
        this.uri = uri;
        this.astNode = usingForDeclaration;
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
        return this;
    }
}
