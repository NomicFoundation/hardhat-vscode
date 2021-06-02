import { ContractDefinition } from "@solidity-parser/parser/dist/src/ast-types";

import * as finder from "../finder";
import {
    Location,
    FinderType,
    DocumentsAnalyzerMap,
    DocumentsAnalyzerTree,
    Node,
    ContractDefinitionNode as IContractDefinitionNode
} from "./Node";

export class ContractDefinitionNode implements IContractDefinitionNode {
    type: string;
    uri: string;
    astNode: ContractDefinition;

    nameLoc?: Location | undefined;

    expressionNode?: Node | undefined;
    declarationNode?: Node | undefined;

    connectionTypeRules: string[] = [ "Identifier", "UserDefinedTypeName", "FunctionCall", "UsingForDeclaration" ];

    parent?: Node | undefined;
    children: Node[] = [];

    typeNodes: Node[] = [];

    inheritanceNodes: ContractDefinitionNode[] = [];

    constructor (contractDefinition: ContractDefinition, uri: string) {
        this.type = contractDefinition.type;
        this.uri = uri;
        this.astNode = contractDefinition;

        if (contractDefinition.loc) {
            this.nameLoc = {
                start: {
                    line: contractDefinition.loc.start.line,
                    column: contractDefinition.loc.start.column + contractDefinition.kind.length + 1
                },
                end: {
                    line: contractDefinition.loc.start.line,
                    column: contractDefinition.loc.start.column + contractDefinition.kind.length + 1 + contractDefinition.name.length
                }
            };
        }

        this.addTypeNode(this);
    }

    getKind(): string {
        return this.astNode.kind;
    }

    getInheritanceNodes(): ContractDefinitionNode[] {
        return this.inheritanceNodes;
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
        return this.astNode.name;
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

        if (parent) {
            this.setParent(parent);
        }

        for (const baseContract of this.astNode.baseContracts) {
            const inheritanceNode = find(baseContract, this.uri).accept(find, documentsAnalyzer, documentsAnalyzerTree, orphanNodes, this);

            const inheritanceNodeDefinition = inheritanceNode.getDefinitionNode();

            if (inheritanceNodeDefinition && inheritanceNodeDefinition instanceof ContractDefinitionNode) {
                this.inheritanceNodes.push(inheritanceNodeDefinition);
            }
        }

        for (const subNode of this.astNode.subNodes) {
            find(subNode, this.uri).accept(find, documentsAnalyzer, documentsAnalyzerTree, orphanNodes, this);
        }

        // Find parent for orphanNodes from this contract in inheritance Nodes 
        this.findParentForOrphanNodesInInheritanceNodes(orphanNodes);

        const rootNode = finder.findSourceUnitNode(parent);
        if (rootNode) {
            const exportNodes = new Array(...rootNode.getExportNodes());
            finder.findChildren(this, exportNodes, false);
        }

        finder.findChildren(this, orphanNodes, false);

        parent?.addChild(this);

        return this;
    }

    findParentForOrphanNodesInInheritanceNodes(orphanNodes: Node[]): void {
        const newOrphanNodes: Node[] = [];

        let orphanNode = orphanNodes.shift();
        while (orphanNode) {
            if (
                this.astNode.loc && orphanNode.astNode.loc &&
                this.astNode.loc.start.line <= orphanNode.astNode.loc.start.line &&
                this.astNode.loc.end.line >= orphanNode.astNode.loc.end.line
            ) {
                const nodeParent = finder.findParent(orphanNode, this, true);

                if (nodeParent) {
                    orphanNode.addTypeNode(nodeParent);

                    orphanNode.setParent(nodeParent);
                    nodeParent?.addChild(orphanNode);
                } else {
                    newOrphanNodes.push(orphanNode);
                }
            } else {
                newOrphanNodes.push(orphanNode);
            }

            orphanNode = orphanNodes.shift();
        }

        // Return to orphanNodes array unhandled orphan nodes
        for (const newOrphanNode of newOrphanNodes) {
            orphanNodes.push(newOrphanNode);
        }
    }
}
