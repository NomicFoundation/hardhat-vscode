import { VariableDeclaration } from "@solidity-parser/parser/dist/src/ast-types";

import { Location, FinderType, Node, Position } from "./Node";

export class VariableDeclarationNode implements Node {
    type: string;
    uri: string;
    astNode: VariableDeclaration;

    nameLoc?: Location | undefined;

    parent?: Node | undefined;
    children: Node[] = [];

    typeNodes: Node[] = [];

    constructor (variableDeclaration: VariableDeclaration, uri: string) {
        this.type = variableDeclaration.type;
        this.uri = uri;

        if (variableDeclaration.loc && variableDeclaration.name) {
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

    getTypeNodes(): Node[] {
        let nodes: Node[] = [];

        this.typeNodes.forEach(typeNode => {
            nodes = nodes.concat(typeNode.getTypeNodes());
        });

        return nodes;
    }

    getName(): string | undefined {
        return this.astNode.name || undefined;
    }

    addChild(child: Node): void {
        this.children.push(child);
    }

    setParent(parent: Node): void {
        this.parent = parent;
    }

    accept(find: FinderType, orphanNodes: Node[], parent?: Node): Node {
        if (parent) {
            this.setParent(parent);
        }

        if (this.astNode.typeName) {
            const typeNode = find(this.astNode.typeName, this.uri).accept(find, orphanNodes, this);
        
            this.typeNodes.push(typeNode);
        }

        parent?.addChild(this);

        return this;
    }

    getDefinitionNode(): Node {
        // TO-DO: Method not implemented
        return this;
    }
}
