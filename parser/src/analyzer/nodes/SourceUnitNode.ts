import { SourceUnit } from "@solidity-parser/parser/dist/src/ast-types";

import * as finder from "../finder";
import {
    Location,
    FinderType,
    DocumentsAnalyzerTree,
    Node,
    SourceUnitNode as ISourceUnitNode
} from "./Node";

export class SourceUnitNode implements ISourceUnitNode {
    type: string;
    uri: string;
    astNode: SourceUnit;

    nameLoc?: Location | undefined;

    exportNodes: Node[] = [];

    expressionNode?: Node | undefined;
    declarationNode?: Node | undefined;

    connectionTypeRules: string[] = [];

    parent?: Node | undefined;
    children: Node[] = [];

    typeNodes: Node[] = [];

    constructor (sourceUnit: SourceUnit, uri: string) {
        this.type = sourceUnit.type;
        this.uri = uri;
        this.astNode = sourceUnit;
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

    addExportNode(exportNode: Node): void {
        this.exportNodes.push(exportNode);
    }

    getExportNodes(): Node[] {
        return this.exportNodes;
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

    accept(find: FinderType, documentsAnalyzerTree: DocumentsAnalyzerTree, orphanNodes: Node[], parent?: Node, expression?: Node): Node {
        this.setExpressionNode(expression);

        finder.setRoot(this);

        for (const child of this.astNode.children) {
            find(child, this.uri).accept(find, documentsAnalyzerTree, orphanNodes, this);
        }

        return this;
    }
}
