import { StructDefinition } from "@solidity-parser/parser/dist/src/ast-types";

import * as finder from "../finder";
import { Location, FinderType, DocumentsAnalyzerTree, Node } from "./Node";

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

    accept(find: FinderType, documentsAnalyzerTree: DocumentsAnalyzerTree, orphanNodes: Node[], parent?: Node, expression?: Node): Node {
        this.setExpressionNode(expression);

        if (parent) {
            this.setParent(parent);
        }

        for (const member of this.astNode.members) {
            find(member, this.uri).accept(find, documentsAnalyzerTree, orphanNodes, this);
        }

        const rootNode = finder.findSourceUnitNode(parent);
        if (rootNode) {
            const exportNodes = new Array(...rootNode.getExportNodes());
            finder.findChildren(this, exportNodes, false);
        }

        finder.findChildren(this, orphanNodes);

        parent?.addChild(this);

        return this;
    }
}
