import { AssemblyFunctionDefinition } from "@solidity-parser/parser/dist/src/ast-types";

import * as finder from "@common/finder";
import { Location, FinderType, DocumentsAnalyzerMap, DocumentsAnalyzerTree, Node } from "@nodes/Node";

export class AssemblyFunctionDefinitionNode implements Node {
    type: string;
    uri: string;
    astNode: AssemblyFunctionDefinition;

    isAlive = true;

    nameLoc?: Location | undefined;

    aliasName?: string | undefined;

    expressionNode?: Node | undefined;
    declarationNode?: Node | undefined;

    connectionTypeRules: string[] = [ "AssemblyCall" ];

    parent?: Node | undefined;
    children: Node[] = [];

    typeNodes: Node[] = [];

    constructor (assemblyFunctionDefinition: AssemblyFunctionDefinition, uri: string) {
        this.type = assemblyFunctionDefinition.type;
        this.uri = uri;
        this.astNode = assemblyFunctionDefinition;
        
        if (assemblyFunctionDefinition.loc && assemblyFunctionDefinition.name) {
            this.nameLoc = {
                start: {
                    line: assemblyFunctionDefinition.loc.start.line,
                    column: assemblyFunctionDefinition.loc.start.column + "function ".length
                },
                end: {
                    line: assemblyFunctionDefinition.loc.start.line,
                    column: assemblyFunctionDefinition.loc.start.column + "function ".length + assemblyFunctionDefinition.name.length
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
        return this.astNode.name;
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
        }

        this.findChildren(orphanNodes);

        for (const argument of this.astNode.arguments) {
            find(argument, this.uri).accept(find, documentsAnalyzer, documentsAnalyzerTree, orphanNodes, this);
        }

        for (const returnArgument of this.astNode.returnArguments) {
            const typeNode = find(returnArgument, this.uri).accept(find, documentsAnalyzer, documentsAnalyzerTree, orphanNodes, this);

            this.addTypeNode(typeNode);
        }

        find(this.astNode.body, this.uri).accept(find, documentsAnalyzer, documentsAnalyzerTree, orphanNodes, this);

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
