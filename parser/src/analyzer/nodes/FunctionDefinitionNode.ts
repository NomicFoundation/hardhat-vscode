import { FunctionDefinition } from "@solidity-parser/parser/dist/src/ast-types";

import * as finder from "../finder";
import {
    Location,
    FinderType,
    DocumentsAnalyzerMap,
    DocumentsAnalyzerTree,
    ContractDefinitionNode,
    Node
} from "./Node";

export class FunctionDefinitionNode implements Node {
    type: string;
    uri: string;
    astNode: FunctionDefinition;

    isAlive = true;

    nameLoc?: Location | undefined;

    aliasName?: string | undefined;

    expressionNode?: Node | undefined;
    declarationNode?: Node | undefined;

    connectionTypeRules: string[] = [ "FunctionCall" ];

    parent?: Node | undefined;
    children: Node[] = [];

    typeNodes: Node[] = [];

    constructor (functionDefinition: FunctionDefinition, uri: string) {
        this.type = functionDefinition.type;
        this.uri = uri;
        this.astNode = functionDefinition;
        
        if (!functionDefinition.isConstructor && functionDefinition.loc && functionDefinition.name) {
            this.nameLoc = {
                start: {
                    line: functionDefinition.loc.start.line,
                    column: functionDefinition.loc.start.column + "function ".length
                },
                end: {
                    line: functionDefinition.loc.start.line,
                    column: functionDefinition.loc.start.column + "function ".length + functionDefinition.name.length
                }
            };
        }
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

            const rootNode = finder.findSourceUnitNode(parent);
            if (rootNode) {
                const exportNodes = new Array(...rootNode.getExportNodes());
                this.findChildren(exportNodes);
            }
        }

        this.findChildren(orphanNodes);

        for (const override of this.astNode.override || []) {
            find(override, this.uri).accept(find, documentsAnalyzer, documentsAnalyzerTree, orphanNodes, this);
        }

        for (const param of this.astNode.parameters) {
            find(param, this.uri).accept(find, documentsAnalyzer, documentsAnalyzerTree, orphanNodes, this);
        }

        for (const returnParam of this.astNode.returnParameters || []) {
            const typeNode = find(returnParam, this.uri).accept(find, documentsAnalyzer, documentsAnalyzerTree, orphanNodes, this);

            this.addTypeNode(typeNode);
        }

        for (const modifier of this.astNode.modifiers || []) {
            const typeNode = find(modifier, this.uri).accept(find, documentsAnalyzer, documentsAnalyzerTree, orphanNodes, this);

            this.addTypeNode(typeNode);
        }

        if (this.astNode.body) {
            find(this.astNode.body, this.uri).accept(find, documentsAnalyzer, documentsAnalyzerTree, orphanNodes, this);
        }

        if (parent?.type === "ContractDefinition") {
            const inheritanceNodes = (parent as ContractDefinitionNode).getInheritanceNodes();
        
            for (const inheritanceNode of inheritanceNodes) {
                for (const child of inheritanceNode.children) {
                    if (child.type === this.type && child.getName() === this.getName()) {
                        this.addChild(child);
                        child.addChild(this);
                    }
                }
            }
        }

        parent?.addChild(this);

        return this;
    }

    private findChildren(orphanNodes: Node[]): void {
        const newOrphanNodes: Node[] = [];
        const parent = this.getParent();

        let orphanNode = orphanNodes.shift();
        while (orphanNode) {
            if (
                this.getName() === orphanNode.getName() && parent &&
                finder.isNodeShadowedByNode(orphanNode, parent) &&
                this.connectionTypeRules.includes(orphanNode.getExpressionNode()?.type || "") &&
                orphanNode.type !== "MemberAccess"
            ) {
                orphanNode.addTypeNode(this);

                orphanNode.setParent(this);
                this.addChild(orphanNode);
            } else {
                newOrphanNodes.push(orphanNode);
            }

            orphanNode = orphanNodes.shift();
        }

        for (const newOrphanNode of newOrphanNodes) {
            orphanNodes.push(newOrphanNode);
        }
    }
}
