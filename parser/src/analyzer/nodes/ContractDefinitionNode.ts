import * as finder from "@common/finder";
import { findSourceUnitNode } from "@common/utils";
import {
    ContractDefinition,
    FinderType,
    Node,
    ContractDefinitionNode as AbstractContractDefinitionNode
} from "@common/types";

export class ContractDefinitionNode extends AbstractContractDefinitionNode {
    astNode: ContractDefinition;

    connectionTypeRules: string[] = [ "Identifier", "UserDefinedTypeName", "FunctionCall", "UsingForDeclaration" ];

    constructor (contractDefinition: ContractDefinition, uri: string) {
        super(contractDefinition, uri);
        this.astNode = contractDefinition;

        if (contractDefinition.loc) {
            const escapePrefix = contractDefinition.kind === "abstract" ? "abstract contract ".length : contractDefinition.kind.length + 1;
            this.nameLoc = {
                start: {
                    line: contractDefinition.loc.start.line,
                    column: contractDefinition.loc.start.column + escapePrefix
                },
                end: {
                    line: contractDefinition.loc.start.line,
                    column: contractDefinition.loc.start.column + escapePrefix + contractDefinition.name.length
                }
            };
        }

        this.addTypeNode(this);
    }

    getKind(): string {
        return this.astNode.kind;
    }

    getTypeNodes(): Node[] {
        return this.typeNodes;
    }

    getDefinitionNode(): Node | undefined {
        return this;
    }

    getName(): string | undefined {
        return this.astNode.name;
    }

    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node {
        this.setExpressionNode(expression);

        if (parent) {
            this.setParent(parent);
        }

        for (const baseContract of this.astNode.baseContracts) {
            const inheritanceNode = find(baseContract, this.uri).accept(find, orphanNodes, this);

            const inheritanceNodeDefinition = inheritanceNode.getDefinitionNode();

            if (inheritanceNodeDefinition && inheritanceNodeDefinition instanceof ContractDefinitionNode) {
                this.inheritanceNodes.push(inheritanceNodeDefinition);
            }
        }

        for (const subNode of this.astNode.subNodes) {
            find(subNode, this.uri).accept(find, orphanNodes, this);
        }

        // Find parent for orphanNodes from this contract in inheritance Nodes 
        this.findParentForOrphanNodesInInheritanceNodes(orphanNodes);

        const rootNode = findSourceUnitNode(parent);
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
