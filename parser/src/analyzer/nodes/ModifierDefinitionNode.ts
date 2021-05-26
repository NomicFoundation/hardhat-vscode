import { ModifierDefinition } from "@solidity-parser/parser/dist/src/ast-types";

import * as finder from "../finder";
import { Location, FinderType, Node } from "./Node";

export class ModifierDefinitionNode implements Node {
    type: string;
    uri: string;
    astNode: ModifierDefinition;

    nameLoc?: Location | undefined;

    expressionNode?: Node | undefined;
    declarationNode?: Node | undefined;

    connectionTypeRules: string[] = [ "ModifierInvocation" ];

    parent?: Node | undefined;
    children: Node[] = [];

    typeNodes: Node[] = [];

    constructor (modifierDefinition: ModifierDefinition, uri: string) {
        this.type = modifierDefinition.type;
        this.uri = uri;
        this.astNode = modifierDefinition;
        
        if (modifierDefinition.loc) {
            this.nameLoc = {
                start: {
                    line: modifierDefinition.loc.start.line,
                    column: modifierDefinition.loc.start.column + "modifier ".length
                },
                end: {
                    line: modifierDefinition.loc.start.line,
                    column: modifierDefinition.loc.start.column + "modifier ".length + modifierDefinition.name.length
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

        for (const override of this.astNode.override || []) {
            find(override, this.uri).accept(find, orphanNodes, this);
        }

        for (const param of this.astNode.parameters || []) {
            find(param, this.uri).accept(find, orphanNodes, this);
        }

        find(this.astNode.body, this.uri).accept(find, orphanNodes, this);

        finder.findChildren(this, orphanNodes);

        parent?.addChild(this);

        return this;
    }
}
