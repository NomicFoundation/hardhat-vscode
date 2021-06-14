import { ModifierInvocation } from "@solidity-parser/parser/dist/src/ast-types";

import * as finder from "../finder";
import { Location, FinderType, DocumentsAnalyzerMap, DocumentsAnalyzerTree, Node } from "./Node";

export class ModifierInvocationNode implements Node {
    type: string;
    uri: string;
    astNode: ModifierInvocation;

    alive = true;

    nameLoc?: Location | undefined;

    aliasName?: string | undefined;

    expressionNode?: Node | undefined;
    declarationNode?: Node | undefined;

    connectionTypeRules: string[] = [];

    parent?: Node | undefined;
    children: Node[] = [];

    typeNodes: Node[] = [];

    constructor (modifierInvocation: ModifierInvocation, uri: string) {
        this.type = modifierInvocation.type;
        this.uri = uri;
        this.astNode = modifierInvocation;
        
        if (modifierInvocation.loc) {
            this.nameLoc = {
                start: {
                    line: modifierInvocation.loc.start.line,
                    column: modifierInvocation.loc.start.column
                },
                end: {
                    line: modifierInvocation.loc.start.line,
                    column: modifierInvocation.loc.start.column + modifierInvocation.name.length
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
        return this.parent?.getDefinitionNode();
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

        child.alive = false;
    }

    setParent(parent: Node | undefined): void {
        this.parent = parent;
    }

    getParent(): Node | undefined {
        return this.parent;
    }

    accept(find: FinderType, documentsAnalyzer: DocumentsAnalyzerMap, documentsAnalyzerTree: DocumentsAnalyzerTree, orphanNodes: Node[], parent?: Node, expression?: Node): Node {
        this.setExpressionNode(expression);

        for (const argument of this.astNode.arguments || []) {
            find(argument, this.uri).accept(find, documentsAnalyzer, documentsAnalyzerTree, orphanNodes, parent);
        }

        if (parent) {
            const modifierInvocationParent = finder.findParent(this, parent);

            if (modifierInvocationParent) {
                this.addTypeNode(modifierInvocationParent);

                this.setParent(modifierInvocationParent);
                modifierInvocationParent?.addChild(this);

                return this;
            }
        }

        orphanNodes.push(this);

        return this;
    }
}
