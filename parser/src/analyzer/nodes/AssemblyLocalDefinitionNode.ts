import { AssemblyLocalDefinition } from "@solidity-parser/parser/dist/src/ast-types";

import { Location, FinderType, Node } from "./Node";

export class AssemblyLocalDefinitionNode implements Node {
    type: string;
    uri: string;
    astNode: AssemblyLocalDefinition;

    name?: string | undefined;
    nameLoc?: Location | undefined;

    expressionNode?: Node | undefined;
    declarationNode?: Node | undefined;

    connectionTypeRules: string[] = [ "AssemblyCall", "Identifier" ];

    parent?: Node | undefined;
    children: Node[] = [];

    typeNodes: Node[] = [];

    constructor (assemblyLocalDefinition: AssemblyLocalDefinition, uri: string, parent?: Node, identifierNode?: Node) {
        this.type = assemblyLocalDefinition.type;
        this.uri = uri;
        this.astNode = assemblyLocalDefinition;

        if (parent && identifierNode) {
            this.setParent(parent);
    
            this.nameLoc = identifierNode.nameLoc;
            this.name = identifierNode.getName();
    
            parent.addChild(this);
        }
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
        return this.name;
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
        
        for (const name of this.astNode.names || []) {
            const identifierNode = find(name, this.uri).accept(find, orphanNodes, this, this);

            new AssemblyLocalDefinitionNode(this.astNode, identifierNode.uri, parent, identifierNode);
        }

        if (this.astNode.expression) {
            find(this.astNode.expression, this.uri).accept(find, orphanNodes, parent);
        }

        return this;
    }
}
