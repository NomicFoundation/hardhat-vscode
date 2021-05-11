import { StructDefinition } from "@solidity-parser/parser/dist/src/ast-types";

import { Location, FinderType, Node } from "./Node";

export class StructDefinitionNode implements Node {
    type: string;
    uri: string;
    astNode: StructDefinition;

    nameLoc?: Location | undefined;

    expressionNode?: Node | undefined;
    declarationNode?: Node | undefined;

    connectionTypeRules: string[] = [ "UserDefinedTypeName", "MemberAccess", "FunctionCall" ];

    parent?: Node | undefined;
    children: Node[] = [];

    typeNodes: Node[] = [];

    constructor (structDefinition: StructDefinition, uri: string) {
        this.type = structDefinition.type;
        this.uri = uri;
        this.astNode = structDefinition;

        if (structDefinition.loc) {
            this.nameLoc = {
                start: {
                    line: structDefinition.loc.start.line,
                    column: structDefinition.loc.start.column + "struct ".length
                },
                end: {
                    line: structDefinition.loc.start.line,
                    column: structDefinition.loc.start.column + "struct ".length + structDefinition.name.length
                }
            };
        }

        this.addTypeNode(this);
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

    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node {
        this.setExpressionNode(expression);

        if (parent) {
            this.setParent(parent);
        }

        for (const member of this.astNode.members) {
            find(member, this.uri).accept(find, orphanNodes, this);
        }

        this.findChildren(orphanNodes);

        parent?.addChild(this);

        return this;
    }

    private findChildren(orphanNodes: Node[]): void {
        const newOrphanNodes: Node[] = [];
        const expressionNodes: Node[] = [];

        let orphanNode = orphanNodes.shift();
        while (orphanNode) {
            if (
                orphanNode.getName() === this.getName() && (
                    this.connectionTypeRules.includes(orphanNode.type) ||
                    this.connectionTypeRules.includes(orphanNode.getExpressionNode()?.type || "")
            )) {
                orphanNode.addTypeNode(this);

                orphanNode.setParent(this);
                this.addChild(orphanNode);

                expressionNodes.push(orphanNode);
            } else {
                newOrphanNodes.push(orphanNode);
            }

            orphanNode = orphanNodes.shift();
        }

        for (const newOrphanNode of newOrphanNodes) {
            orphanNodes.push(newOrphanNode);
        }

        // Find struct type references for all expressions
        for (const expressionNode of expressionNodes) {
            this.findExpressionNodes(expressionNode, orphanNodes);
        }
    }

    private findExpressionNodes(node: Node, orphanNodes: Node[]): void {
        const newOrphanNodes: Node[] = [];
        const declarationNode = node.getDeclarationNode();

        if (!declarationNode) {
            return;
        }

        let orphanNode = orphanNodes.shift();
        while (orphanNode) {

            if (this.matchNodeExpression(orphanNode, declarationNode)) {
                for (const definitionChild of this.children) {

                    if (definitionChild.getName() && definitionChild.getName() === orphanNode.getName()) {
                        orphanNode.addTypeNode(definitionChild);

                        orphanNode.setParent(definitionChild);
                        definitionChild?.addChild(orphanNode);

                        this.nestNode(orphanNode, orphanNodes);
                    }
                }
            } else {
                newOrphanNodes.push(orphanNode);
            }

            orphanNode = orphanNodes.shift();
        }

        for (const newOrphanNode of newOrphanNodes) {
            orphanNodes.push(newOrphanNode);
        }
    }

    private matchNodeExpression(expression: Node, node: Node): boolean {
        for (const child of node.children) {
            const expressionNode = child.getExpressionNode();

            if (
                expressionNode &&
                expressionNode.nameLoc && expression.nameLoc &&
                JSON.stringify(expressionNode.nameLoc) === JSON.stringify(expression.nameLoc) &&
                expressionNode.getName() === expression.getName()
            ) {
                return true;
            }
		}

        return false;
    }

    private nestNode(node: Node, orphanNodes: Node[]): void {
        let expressionNode = node.getExpressionNode();
        if (!expressionNode) {
            return;
        }

        while (expressionNode.type !== "MemberAccess") {

            expressionNode = expressionNode.getExpressionNode();
            if (!expressionNode) {
                return;
            }
        }

        const orphanNode = orphanNodes.shift();
        if (!orphanNode) {
            return;
        }

        if (
            expressionNode &&
            expressionNode.nameLoc && orphanNode.nameLoc &&
            JSON.stringify(expressionNode.nameLoc) === JSON.stringify(orphanNode.nameLoc) &&
            expressionNode.getName() === orphanNode.getName()
        ) {
            for (const definitionType of node.getTypeNodes()) {
                for (const definitionChild of definitionType.children) {
                    if (definitionChild.getName() && definitionChild.getName() === orphanNode.getName()) {
                        orphanNode.addTypeNode(definitionChild);

                        orphanNode.setParent(definitionChild);
                        definitionChild?.addChild(orphanNode);
    
                        this.nestNode(orphanNode, orphanNodes);
                    }
                }
            }
        } else {
            orphanNodes.unshift(orphanNode);
        }
    }
}
