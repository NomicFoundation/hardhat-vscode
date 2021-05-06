import { VariableDeclarationStatement } from "@solidity-parser/parser/dist/src/ast-types";

import { Location, FinderType, Node, Position } from "./Node";

export class VariableDeclarationStatementNode implements Node {
    type: string;
    uri: string;
    astNode: VariableDeclarationStatement;

    nameLoc?: Location | undefined;

    parent?: Node | undefined;
    children: Node[] = [];

    typeNodes: Node[] = [];

    constructor (variableDeclarationStatement: VariableDeclarationStatement, uri: string) {
        this.type = variableDeclarationStatement.type;
        this.uri = uri;
        this.astNode = variableDeclarationStatement;
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
        for (const variable of this.astNode.variables) {
            if (variable) {
                find(variable, this.uri).accept(find, orphanNodes, parent);
            }
        }

        if (this.astNode.initialValue) {
            find(this.astNode.initialValue, this.uri).accept(find, orphanNodes, parent);
        }

        return this;
    }

    getDefinitionNode(): Node {
        // TO-DO: Method not implemented
        return this;
    }
}
