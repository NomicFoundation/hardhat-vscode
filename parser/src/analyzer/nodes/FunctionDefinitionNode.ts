import { isNodeShadowedByNode, findSourceUnitNode } from "@common/utils";
import {
    FunctionDefinition, FinderType, ContractDefinitionNode,
    Node, FunctionDefinitionNode as IFunctionDefinitionNode
} from "@common/types";

export class FunctionDefinitionNode extends IFunctionDefinitionNode {
    astNode: FunctionDefinition;

    connectionTypeRules: string[] = [ "FunctionCall" ];

    constructor (functionDefinition: FunctionDefinition, uri: string) {
        super(functionDefinition, uri);
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

    getDefinitionNode(): Node | undefined {
        return this;
    }

    getName(): string | undefined {
        return this.astNode.name || undefined;
    }

    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node {
        this.setExpressionNode(expression);

        if (parent) {
            this.setParent(parent);

            const rootNode = findSourceUnitNode(parent);
            if (rootNode) {
                const exportNodes = new Array(...rootNode.getExportNodes());
                this.findChildren(exportNodes);
            }
        }

        this.findChildren(orphanNodes);

        for (const override of this.astNode.override || []) {
            find(override, this.uri).accept(find, orphanNodes, this);
        }

        for (const param of this.astNode.parameters) {
            find(param, this.uri).accept(find, orphanNodes, this);
        }

        for (const returnParam of this.astNode.returnParameters || []) {
            const typeNode = find(returnParam, this.uri).accept(find, orphanNodes, this);

            this.addTypeNode(typeNode);
        }

        for (const modifier of this.astNode.modifiers || []) {
            const typeNode = find(modifier, this.uri).accept(find, orphanNodes, this);

            this.addTypeNode(typeNode);
        }

        if (this.astNode.body) {
            find(this.astNode.body, this.uri).accept(find, orphanNodes, this);
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
                isNodeShadowedByNode(orphanNode, parent) &&
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
