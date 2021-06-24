import * as finder from "@common/finder";
import { isNodeConnectable, findSourceUnitNode } from "@common/utils";
import { MemberAccess, FinderType, ContractDefinitionNode, Node, expressionNodeTypes } from "@common/types";

export class MemberAccessNode extends Node {
    astNode: MemberAccess;

    constructor (memberAccess: MemberAccess, uri: string) {
        super(memberAccess, uri);

        if (memberAccess.loc) {
            // Bug in solidity parser doesn't give exact locations
            memberAccess.loc.start.line = memberAccess.loc.end.line;
            memberAccess.loc.start.column = memberAccess.loc.end.column;
            memberAccess.loc.end.column = memberAccess.loc.end.column + memberAccess.memberName.length;

            this.nameLoc = JSON.parse(JSON.stringify(memberAccess.loc));
        }

        this.astNode = memberAccess;
    }

    getName(): string | undefined {
        return this.astNode.memberName;
    }

    setParent(parent: Node | undefined): void {
        this.parent = parent;

        let expressionNode = this.getExpressionNode();
        if (parent && expressionNode && expressionNodeTypes.includes(expressionNode.type)) {
            if (expressionNode.type !== "MemberAccess") {
                expressionNode = expressionNode.getExpressionNode();
            }

            if (expressionNode && expressionNode.type === "MemberAccess") {
                const definitionTypes = parent.getTypeNodes();

                this.findMemberAccessParent(expressionNode, definitionTypes);
            }
        }
    }

    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node {
        this.setExpressionNode(expression);

        const expressionNode = find(this.astNode.expression, this.uri).accept(find, orphanNodes, parent, this);
        const definitionTypes = expressionNode.getTypeNodes();

        if (!expressionNode.parent) {
            const handled = this.findMemberAccessParent(expressionNode, definitionTypes);
            if (handled) {
                return handled;
            }
        }

        // The Identifier name "super" is reserved, so we will try to find the parent for this Node in inheritance Nodes
        if (expressionNode.getName() === "super" && expressionNode.type === "Identifier") {
            let contractDefinitionNode = parent;

            while (contractDefinitionNode && contractDefinitionNode.type !== "ContractDefinition") {
                contractDefinitionNode = contractDefinitionNode.getParent();
            }

            const inheritanceNodes = (contractDefinitionNode as ContractDefinitionNode).getInheritanceNodes();

            for (let i = inheritanceNodes.length - 1; i >= 0; i--) {
                const inheritanceNode = inheritanceNodes[i];

                const memberAccessParent = finder.findParent(this, inheritanceNode, true);

                if (memberAccessParent) {
                    this.addTypeNode(memberAccessParent);

                    this.setParent(memberAccessParent);
                    memberAccessParent?.addChild(this);

                    return this;
                }
            }
        }

        // The Identifier name "this" is reserved, so we will try to find the parent for this Node in contract first layer
        if (expressionNode.getName() === "this" && expressionNode.type === "Identifier") {
            let contractDefinitionNode = parent;

            while (contractDefinitionNode && contractDefinitionNode.type !== "ContractDefinition") {
                contractDefinitionNode = contractDefinitionNode.getParent();
            }

            const memberAccessParent = finder.findParent(this, contractDefinitionNode, true);

            if (memberAccessParent) {
                this.addTypeNode(memberAccessParent);

                this.setParent(memberAccessParent);
                memberAccessParent?.addChild(this);

                return this;
            }
        }

        // Never add MemberAccessNode to orphanNodes because it is handled via expression

        return this;
    }

    findMemberAccessParent(expressionNode: Node, definitionTypes: Node[]): Node | undefined {
        for (const definitionType of definitionTypes) {
            for (const definitionChild of definitionType.children) {
                if (isNodeConnectable(definitionChild, expressionNode)) {
                    expressionNode.addTypeNode(definitionChild);

                    expressionNode.setParent(definitionChild);
                    definitionChild?.addChild(expressionNode);

                    // If the parent uri and node uri are not the same, add the node to the exportNode field
                    if (definitionChild && definitionChild.uri !== expressionNode.uri) {
                        const exportRootNode = findSourceUnitNode(definitionChild);
                        const importRootNode = findSourceUnitNode(finder.analyzerTree);

                        if (exportRootNode) {
                            exportRootNode.addExportNode(expressionNode);
                        }

                        if (importRootNode) {
                            importRootNode.addImportNode(expressionNode);
                        }
                    }

                    return this;
                }
            }
        }

        return undefined;
    }
}
