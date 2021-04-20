import { VariableDeclaration } from "@solidity-parser/parser/dist/ast-types";

import { Location, FinderType, Node } from "./Node";

export class VariableDeclarationNode implements Node {
    type: string;
    uri: string;
    astNode: VariableDeclaration;

    nameLoc?: Location | undefined;

    parent?: Node | undefined;
    children: Node[] = [];

    constructor (variableDeclaration: VariableDeclaration, uri: string) {
        this.type = variableDeclaration.type;
        this.uri = uri;

        if (variableDeclaration.loc) {
            // Bug in solidity parser doesn't give exact end location
            variableDeclaration.loc.end.column = variableDeclaration.loc.end.column + variableDeclaration.name.length

            this.nameLoc = {
                start: {
                    line: variableDeclaration.loc.end.line,
                    column: variableDeclaration.loc.end.column - variableDeclaration.name.length
                },
                end: {
                    line: variableDeclaration.loc.end.line,
                    column: variableDeclaration.loc.end.column
                }
            };
        }

        this.astNode = variableDeclaration;
    }

    addChild(child: Node): void {
        this.children.push(child);
    }

    setParent(parent: Node): void {
        this.parent = parent;
    }

    accept(find: FinderType, orphanNodes: Node[], parent?: Node): void {
        if (parent) {
            this.setParent(parent);
        }

        find(this.astNode.typeName, this.uri).accept(find, orphanNodes, this);

        parent?.addChild(this);
    }
}
