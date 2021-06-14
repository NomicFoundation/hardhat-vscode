import { LabelDefinition } from "@solidity-parser/parser/dist/src/ast-types";

import { Location, FinderType, DocumentsAnalyzerMap, DocumentsAnalyzerTree, Node } from "./Node";

export class LabelDefinitionNode implements Node {
    type: string;
    uri: string;
    astNode: LabelDefinition;

    alive = true;

    nameLoc?: Location | undefined;

    aliasName?: string | undefined;

    expressionNode?: Node | undefined;
    declarationNode?: Node | undefined;

    connectionTypeRules: string[] = [];

    parent?: Node | undefined;
    children: Node[] = [];

    typeNodes: Node[] = [];

    constructor (labelDefinition: LabelDefinition, uri: string) {
        this.type = labelDefinition.type;
        this.uri = uri;
        this.astNode = labelDefinition;
        // TO-DO: Implement name location for rename
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
        return this;
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

        child.alive = false;
    }

    setParent(parent: Node | undefined): void {
        this.parent = parent;
    }

    getParent(): Node | undefined {
        return this.parent;
    }

    accept(find: FinderType, documentsAnalyzer: DocumentsAnalyzerMap, documentsAnalyzerTree: DocumentsAnalyzerTree, orphanNodes: Node[], parent?: Node, expression?: Node): Node {
        this.setExpressionNode(expression);
        // TO-DO: Method not implemented
        return this;
    }
}
