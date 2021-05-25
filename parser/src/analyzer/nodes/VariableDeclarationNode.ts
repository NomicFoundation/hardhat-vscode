import { VariableDeclaration, StateVariableDeclarationVariable } from "@solidity-parser/parser/dist/src/ast-types";

import { Location, FinderType, Node } from "./Node";

export class VariableDeclarationNode implements Node {
    type: string;
    uri: string;
    astNode: VariableDeclaration;

    nameLoc?: Location | undefined;

    expressionNode?: Node | undefined;
    declarationNode?: Node | undefined;

    connectionTypeRules: string[] = [ "Identifier", "MemberAccess" ];

    parent?: Node | undefined;
    children: Node[] = [];

    typeNodes: Node[] = [];

    constructor (variableDeclaration: VariableDeclaration, uri: string) {
        this.type = variableDeclaration.type;
        this.uri = uri;

        if (variableDeclaration.loc && variableDeclaration.name) {
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

    addTypeNode(node: Node): void {
        this.typeNodes.push(node);
    }

    getExpressionNode(): Node | undefined {
        return this.expressionNode;
    }

    setExpressionNode(node: Node | undefined): void {
        this.expressionNode = node;
    }

    getDeclarationNode(): Node | undefined {
        return this.declarationNode;
    }

    setDeclarationNode(node: Node | undefined): void {
        this.declarationNode = node;
    }

    getDefinitionNode(): Node | undefined {
        return this;
    }

    getName(): string | undefined {
        return this.astNode.name || undefined;
    }

    addChild(child: Node): void {
        this.children.push(child);
    }

    setParent(parent: Node | undefined): void {
        this.parent = parent;
    }

    getParent(): Node | undefined {
        return this.parent;
    }

    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node {
        this.setExpressionNode(expression);

        if (parent) {
            this.setParent(parent);
        }

        if (this.astNode.typeName) {
            const typeNode = find(this.astNode.typeName, this.uri).accept(find, orphanNodes, this);
        
            this.addTypeNode(typeNode);
            typeNode.setDeclarationNode(this);

            this.updateLocationName(typeNode);
        }

        // Don't handle expression, it is handled in StateVariableDeclarationNode

        parent?.addChild(this);

        return this;
    }

    updateLocationName(typeNode: Node): void {
        if (this.astNode.loc && this.nameLoc && typeNode.astNode.range) {
            const diff = 1 + (+typeNode.astNode.range[1] - +typeNode.astNode.range[0]);

            this.nameLoc.start.column = this.astNode.loc.start.column + diff + 1;
            this.nameLoc.end.column = this.nameLoc.start.column + (this.getName()?.length || 0);

            if (this.astNode.visibility && this.astNode.visibility !== "default" ) {
                this.nameLoc.start.column += this.astNode.visibility.length + 1;
                this.nameLoc.end.column += this.astNode.visibility.length + 1;
            }

            if (this.astNode.storageLocation) {
                this.nameLoc.start.column += this.astNode.storageLocation.length + 1;
                this.nameLoc.end.column += this.astNode.storageLocation.length + 1;
            }

            if (this.astNode.isDeclaredConst) {
                this.nameLoc.start.column += "constant ".length;
                this.nameLoc.end.column += "constant ".length;
            }

            if ((this.astNode as StateVariableDeclarationVariable).isImmutable) {
                this.nameLoc.start.column += "immutable ".length;
                this.nameLoc.end.column += "immutable ".length;
            }

            if (this.astNode.loc.end.column < this.nameLoc.end.column) {
                this.astNode.loc.end.column = this.nameLoc.end.column;
            }
        }
    }
}
