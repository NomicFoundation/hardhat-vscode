import { VariableDeclarationStatement } from "@solidity-parser/parser/dist/src/ast-types";

import { Location, FinderType, DocumentsAnalyzerTree, Node } from "./Node";

export class VariableDeclarationStatementNode implements Node {
    type: string;
    uri: string;
    astNode: VariableDeclarationStatement;

    nameLoc?: Location | undefined;

    expressionNode?: Node | undefined;
    declarationNode?: Node | undefined;

    connectionTypeRules: string[] = [];

    parent?: Node | undefined;
    children: Node[] = [];

    typeNodes: Node[] = [];

    constructor (variableDeclarationStatement: VariableDeclarationStatement, uri: string) {
        this.type = variableDeclarationStatement.type;
        this.uri = uri;
        this.astNode = variableDeclarationStatement;
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
        return undefined;
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

    accept(find: FinderType, documentsAnalyzerTree: DocumentsAnalyzerTree, orphanNodes: Node[], parent?: Node, expression?: Node): Node {
        this.setExpressionNode(expression);

        for (const variable of this.astNode.variables) {
            if (variable) {
                find(variable, this.uri).accept(find, documentsAnalyzerTree, orphanNodes, parent);
            }
        }

        if (this.astNode.initialValue) {
            find(this.astNode.initialValue, this.uri).accept(find, documentsAnalyzerTree, orphanNodes, parent);
        }

        return this;
    }
}
