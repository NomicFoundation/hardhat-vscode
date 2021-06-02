import { IndexRangeAccess } from "@solidity-parser/parser/dist/src/ast-types";

import { Location, FinderType, DocumentsAnalyzerMap, DocumentsAnalyzerTree, Node } from "./Node";

export class IndexRangeAccessNode implements Node {
    type: string;
    uri: string;
    astNode: IndexRangeAccess;

    nameLoc?: Location | undefined;

    expressionNode?: Node | undefined;
    declarationNode?: Node | undefined;

    connectionTypeRules: string[] = [];

    parent?: Node | undefined;
    children: Node[] = [];

    typeNodes: Node[] = [];

    constructor (indexRangeAccess: IndexRangeAccess, uri: string) {
        this.type = indexRangeAccess.type;
        this.uri = uri;
        this.astNode = indexRangeAccess;
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
        return this.parent?.getDefinitionNode();
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

    accept(find: FinderType, documentsAnalyzer: DocumentsAnalyzerMap, documentsAnalyzerTree: DocumentsAnalyzerTree, orphanNodes: Node[], parent?: Node, expression?: Node): Node {
        this.setExpressionNode(expression);

        if (this.astNode.base) {
            find(this.astNode.base, this.uri).accept(find, documentsAnalyzer, documentsAnalyzerTree, orphanNodes, parent);
        }

        if (this.astNode.indexStart) {
            find(this.astNode.indexStart, this.uri).accept(find, documentsAnalyzer, documentsAnalyzerTree, orphanNodes, parent);
        }

        if (this.astNode.indexEnd) {
            find(this.astNode.indexEnd, this.uri).accept(find, documentsAnalyzer, documentsAnalyzerTree, orphanNodes, parent);
        }

        return this;
    }
}
