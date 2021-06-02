import { UserDefinedTypeName } from "@solidity-parser/parser/dist/src/ast-types";

import * as finder from "../finder";
import { Location, FinderType, DocumentsAnalyzerMap, DocumentsAnalyzerTree, Node } from "./Node";

export class UserDefinedTypeNameNode implements Node {
    type: string;
    uri: string;
    astNode: UserDefinedTypeName;

    nameLoc?: Location | undefined;

    expressionNode?: Node | undefined;
    declarationNode?: Node | undefined;

    connectionTypeRules: string[] = [];

    parent?: Node | undefined;
    children: Node[] = [];

    typeNodes: Node[] = [];

    constructor (userDefinedTypeName: UserDefinedTypeName, uri: string) {
        this.type = userDefinedTypeName.type;
        this.uri = uri;

        if (userDefinedTypeName.loc) {
            // Bug in solidity parser doesn't give exact end location
            userDefinedTypeName.loc.end.column = userDefinedTypeName.loc.end.column + userDefinedTypeName.namePath.length;

            this.nameLoc = JSON.parse(JSON.stringify(userDefinedTypeName.loc));
        }

        this.astNode = userDefinedTypeName;
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
        return this.astNode.namePath;
    }

    addChild(child: Node): void {
        this.children.push(child);
    }

    setParent(parent: Node | undefined): void {
        this.parent = parent;

        const declarationNode = this.getDeclarationNode();

        for (const child of declarationNode?.children || []) {
            const expressionNode = child.getExpressionNode();

            if (parent && expressionNode && expressionNode.type === "MemberAccess") {
                const definitionTypes = parent.getTypeNodes();
    
                this.findMemberAccessParent(expressionNode, definitionTypes);
            }
        }
    }

    getParent(): Node | undefined {
        return this.parent;
    }

    accept(find: FinderType, documentsAnalyzer: DocumentsAnalyzerMap, documentsAnalyzerTree: DocumentsAnalyzerTree, orphanNodes: Node[], parent?: Node, expression?: Node): Node {
        this.setExpressionNode(expression);

        if (parent) {
            const definitionParent = finder.findParent(this, parent);

            if (definitionParent) {
                this.addTypeNode(definitionParent);

                this.setParent(definitionParent);
                definitionParent?.addChild(this);

                return this;
            }
        }

        orphanNodes.push(this);

        return this;
    }

    findMemberAccessParent(expressionNode: Node, definitionTypes: Node[]): void {
        for (const definitionType of definitionTypes) {
            for (const definitionChild of definitionType.children) {
                if (finder.isNodeConnectable(definitionChild, expressionNode)) {
                    expressionNode.addTypeNode(definitionChild);

                    expressionNode.setParent(definitionChild);
                    definitionChild?.addChild(expressionNode);

                    return;
                }
            }
        }
    }
}
