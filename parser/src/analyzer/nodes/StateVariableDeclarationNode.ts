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
        for (const variable of this.astNode.variables) {
            find(variable, this.uri).accept(find, orphanNodes, parent);
        }

        if (this.astNode.initialValue) {
            find(this.astNode.initialValue, this.uri).accept(find, orphanNodes, parent);
        }
    }
}
