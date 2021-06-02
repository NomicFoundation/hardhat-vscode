import { EventDefinition } from "@solidity-parser/parser/dist/src/ast-types";

import * as finder from "../finder";
import { Location, FinderType, DocumentsAnalyzerTree, Node } from "./Node";

export class EventDefinitionNode implements Node {
    type: string;
    uri: string;
    astNode: EventDefinition;

    nameLoc?: Location | undefined;

    expressionNode?: Node | undefined;
    declarationNode?: Node | undefined;

    connectionTypeRules: string[] = [ "EmitStatement" ];

    parent?: Node | undefined;
    children: Node[] = [];

    typeNodes: Node[] = [];

    constructor (eventDefinition: EventDefinition, uri: string) {
        this.type = eventDefinition.type;
        this.uri = uri;
        this.astNode = eventDefinition;

        if (eventDefinition.loc && eventDefinition.name) {
            this.nameLoc = {
                start: {
                    line: eventDefinition.loc.start.line,
                    column: eventDefinition.loc.start.column + "event ".length
                },
                end: {
                    line: eventDefinition.loc.start.line,
                    column: eventDefinition.loc.start.column + "event ".length + (this.getName()?.length || 0)
                }
            };
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

        for (const parameter of this.astNode.parameters) {
            find(parameter, this.uri).accept(find, documentsAnalyzerTree, orphanNodes, parent);
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
