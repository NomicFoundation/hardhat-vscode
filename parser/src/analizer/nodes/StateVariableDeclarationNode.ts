import { StateVariableDeclaration } from "@solidity-parser/parser/dist/ast-types";

import { Location, FinderType, Node } from "./Node";

export class StateVariableDeclarationNode implements Node {
    type: string;
    uri: string;
    astNode: StateVariableDeclaration;

    nameLoc?: Location | undefined;

    parent?: Node | undefined;
    children: Node[] = [];

    constructor (stateVariableDeclaration: StateVariableDeclaration, uri: string) {
        this.type = stateVariableDeclaration.type;
        this.uri = uri;
        this.astNode = stateVariableDeclaration;
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
