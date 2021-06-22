import { isNodeShadowedByNode } from "@common/utils";
import { AssemblyFunctionDefinition, FinderType, Node } from "@common/types";

export class AssemblyFunctionDefinitionNode extends Node {
    astNode: AssemblyFunctionDefinition;

    connectionTypeRules: string[] = [ "AssemblyCall" ];

    constructor (assemblyFunctionDefinition: AssemblyFunctionDefinition, uri: string) {
        super(assemblyFunctionDefinition, uri);

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

        this.findChildren(orphanNodes);

        for (const argument of this.astNode.arguments) {
            find(argument, this.uri).accept(find, orphanNodes, this);
        }

        for (const returnArgument of this.astNode.returnArguments) {
            const typeNode = find(returnArgument, this.uri).accept(find, orphanNodes, this);

            this.addTypeNode(typeNode);
        }

        find(this.astNode.body, this.uri).accept(find, orphanNodes, this);

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
