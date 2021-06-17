import { ForStatement } from "@solidity-parser/parser/dist/src/ast-types";

import { Location, FinderType, DocumentsAnalyzerMap, DocumentsAnalyzerTree, Node } from "@nodes/Node";

export class ForStatementNode implements Node {
    type: string;
    uri: string;
    astNode: ForStatement;

    isAlive = true;

    nameLoc?: Location | undefined;

    aliasName?: string | undefined;

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
        return undefined;
    }

    getName(): string | undefined {
        return undefined;
    }

    getAliasName(): string | undefined {
        return this.aliasName;
    }

    setAliasName(aliasName: string | undefined): void {
        this.aliasName = aliasName;
    }

    addChild(child: Node): void {
        this.children.push(child);
    }

    removeChild(child: Node): void {
        const index = this.children.indexOf(child, 0);

        if (index > -1) {
            this.children.splice(index, 1);
        }

        child.isAlive = false;
    }

    setParent(parent: Node | undefined): void {
        this.parent = parent;
    }

    getParent(): Node | undefined {
        return this.parent;
    }

    accept(find: FinderType, documentsAnalyzer: DocumentsAnalyzerMap, documentsAnalyzerTree: DocumentsAnalyzerTree, orphanNodes: Node[], parent?: Node, expression?: Node): Node {
        this.setExpressionNode(expression);

        if (parent) {
            this.setParent(parent);
        }

        if (this.astNode.initExpression) {
            find(this.astNode.initExpression, this.uri).accept(find, documentsAnalyzer, documentsAnalyzerTree, orphanNodes, this);
        }
        if (this.astNode.conditionExpression) {
            find(this.astNode.conditionExpression, this.uri).accept(find, documentsAnalyzer, documentsAnalyzerTree, orphanNodes, this);
        }
        if (this.astNode.loopExpression) {
            find(this.astNode.loopExpression, this.uri).accept(find, documentsAnalyzer, documentsAnalyzerTree, orphanNodes, this);
        }

        find(this.astNode.body, this.uri).accept(find, documentsAnalyzer, documentsAnalyzerTree, orphanNodes, this);

        parent?.addChild(this);

        return this;
    }
}
