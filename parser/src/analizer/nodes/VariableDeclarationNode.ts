import { AST, VariableDeclaration } from "@solidity-parser/parser/dist/ast-types";

import { Location, Node } from "./Node";

export class VariableDeclarationNode implements Node {
    type: string;

    uri: string;
    nameLoc?: Location | undefined;

    parent?: Node | undefined;
    children: Node[] = [];

    astNode: AST;

    constructor (variableDeclaration: VariableDeclaration, uri: string) {
        this.type = variableDeclaration.type;

        this.uri = uri;
        // TO-DO: Implement name location for rename

        this.astNode = variableDeclaration;
    }

    addChild(child: Node): void {
        this.children.push(child);
    }

    setParent(parent: Node): void {
        this.parent = parent;
    }

    accept(orphanNodes: Node[], parent?: Node): void {
        // TO-DO: Method not implemented
    }
}
