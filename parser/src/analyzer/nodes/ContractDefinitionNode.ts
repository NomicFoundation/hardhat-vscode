import { ContractDefinition } from "@solidity-parser/parser/dist/src/ast-types";

import { Location, FinderType, Node, Position } from "./Node";

export class ContractDefinitionNode implements Node {
    type: string;
    uri: string;
    astNode: ContractDefinition;

    nameLoc?: Location | undefined;

    expressionNode?: Node | undefined;

    parent?: Node | undefined;
    children: Node[] = [];

    typeNodes: Node[] = [];

    constructor (contractDefinition: ContractDefinition, uri: string) {
        this.type = contractDefinition.type;
        this.uri = uri;
        this.astNode = contractDefinition;
        
        if (contractDefinition.loc) {
            this.nameLoc = {
                start: {
                    line: contractDefinition.loc.start.line,
                    column: contractDefinition.loc.start.column + "contract ".length
                },
                end: {
                    line: contractDefinition.loc.start.line,
                    column: contractDefinition.loc.start.column + "contract ".length + contractDefinition.name.length
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

    getDefinitionNode(): Node {
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

    accept(find: FinderType, orphanNodes: Node[], parent?: Node): Node {
        if (parent) {
            this.setParent(parent);
        }

        this.findChildren(orphanNodes);
        
        for (const subNode of this.astNode.subNodes) {
            find(subNode, this.uri).accept(find, orphanNodes, this);
        }

        parent?.addChild(this);

        return this;
    }

    private findChildren(orphanNodes: Node[]): void {
        const newOrphanNodes: Node[] = [];

        for (const orphanNode of orphanNodes) {
            if (
                ['UserDefinedTypeName', 'FunctionCall'].includes(orphanNode.type) &&
                orphanNode.getName() === this.getName()
            ) {
                orphanNode.setParent(this);
                orphanNode.addTypeNode(this);

                this.addChild(orphanNode);
            } else {
                newOrphanNodes.push(orphanNode);
            }
        }

        orphanNodes = newOrphanNodes;
    }
}
