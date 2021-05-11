import { ForStatement } from "@solidity-parser/parser/dist/src/ast-types";

import { Location, FinderType, Node } from "./Node";

export class ForStatementNode implements Node {
    type: string;
    uri: string;
    astNode: ForStatement;

    nameLoc?: Location | undefined;

    expressionNode?: Node | undefined;
    declarationNode?: Node | undefined;

    connectionTypeRules: string[] = [];

    parent?: Node | undefined;
    children: Node[] = [];

    typeNodes: Node[] = [];

    constructor (forStatement: ForStatement, uri: string) {
        this.type = forStatement.type;
        this.uri = uri;
        this.astNode = forStatement;
    }

    getTypeNodes(): Node[] {
        return this.typeNodes;
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
        return undefined;
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

    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node {
        this.setExpressionNode(expression);

        if (parent) {
            this.setParent(parent);
        }

        if (this.astNode.initExpression) {
            find(this.astNode.initExpression, this.uri).accept(find, orphanNodes, this);
        }
        if (this.astNode.conditionExpression) {
            find(this.astNode.conditionExpression, this.uri).accept(find, orphanNodes, this);
        }
        if (this.astNode.loopExpression) {
            find(this.astNode.loopExpression, this.uri).accept(find, orphanNodes, this);
        }

        find(this.astNode.body, this.uri).accept(find, orphanNodes, this);

        parent?.addChild(this);

        return this;
    }
}
