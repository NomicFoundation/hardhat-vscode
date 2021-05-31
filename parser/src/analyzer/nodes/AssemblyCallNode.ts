import { AssemblyCall } from "@solidity-parser/parser/dist/src/ast-types";

import * as finder from "../finder";
import { Location, FinderType, DocumentsAnalyzerTree, Node } from "./Node";

export class AssemblyCallNode implements Node {
    type: string;
    uri: string;
    astNode: AssemblyCall;

    nameLoc?: Location | undefined;

    expressionNode?: Node | undefined;
    declarationNode?: Node | undefined;

    connectionTypeRules: string[] = [];

    parent?: Node | undefined;
    children: Node[] = [];

    typeNodes: Node[] = [];

    constructor (assemblyCall: AssemblyCall, uri: string) {
        this.type = assemblyCall.type;
        this.uri = uri;

        if (assemblyCall.loc) {
            // Bug in solidity parser doesn't give exact end location
            assemblyCall.loc.end.column = assemblyCall.loc.end.column + assemblyCall.functionName.length;

            this.nameLoc = JSON.parse(JSON.stringify(assemblyCall.loc));
        }

        this.astNode = assemblyCall;
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
        return this.astNode.functionName;
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

        for (const argument of this.astNode.arguments || []) {
            find(argument, this.uri).accept(find, documentsAnalyzerTree, orphanNodes, parent);
        }

        if (parent) {
            const assemblyCallParent = finder.findParent(this, parent);

            if (assemblyCallParent) {
                this.addTypeNode(assemblyCallParent);

                this.setParent(assemblyCallParent);
                assemblyCallParent?.addChild(this);

                return this;
            }
        }

        orphanNodes.push(this);

        return this;
    }
}
