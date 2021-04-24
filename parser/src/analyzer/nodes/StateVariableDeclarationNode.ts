import { StateVariableDeclaration } from "@solidity-parser/parser/dist/ast-types";

import { Location, FinderType, Node } from "./Node";

export class StateVariableDeclarationNode implements Node {
    type: string;
    uri: string;
    astNode: StateVariableDeclaration;

    nameLoc?: Location | undefined;

    parent?: Node | undefined;
    children: Node[] = [];

    typeNodes: Node[] = [];

    constructor (stateVariableDeclaration: StateVariableDeclaration, uri: string) {
        this.type = stateVariableDeclaration.type;
        this.uri = uri;
        this.astNode = stateVariableDeclaration;
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
        for (const variable of this.astNode.variables) {
            find(variable, this.uri).accept(find, orphanNodes, parent);
        }

        if (this.astNode.initialValue) {
            find(this.astNode.initialValue, this.uri).accept(find, orphanNodes, parent);
        }

        return this;
    }
}
