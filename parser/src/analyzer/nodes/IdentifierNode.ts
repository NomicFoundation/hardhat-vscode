import * as finder from "@common/finder";
import { isNodeConnectable, findSourceUnitNode } from "@common/utils";
import { Identifier, FinderType, Node } from "@common/types";

export class IdentifierNode extends Node {
    astNode: Identifier;

    constructor (identifier: Identifier, uri: string) {
        super(identifier, uri);
        
        if (identifier.loc && identifier.range) {
            // Bug in solidity parser doesn't give exact end location
            identifier.loc.end.column = identifier.loc.end.column + (identifier.range[1] - identifier.range[0]) + 1;

            this.nameLoc = JSON.parse(JSON.stringify(identifier.loc));
        }

        this.astNode = identifier;
    }

    getName(): string | undefined {
        return this.astNode.name;
    }

    setParent(parent: Node | undefined): void {
        this.parent = parent;

        const expressionNode = this.getExpressionNode();
        if (parent && expressionNode && expressionNode.type === "MemberAccess") {
            const definitionTypes = parent.getTypeNodes();

            this.findMemberAccessParent(expressionNode, definitionTypes);
        }
    }

    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node {
        this.setExpressionNode(expression);

        if (expression?.type === "AssemblyLocalDefinition") {
            return this;
        }

        if (expression?.type === "ImportDirective" && parent) {
            const definitionNode = parent.getDefinitionNode();

            if (definitionNode) {
                this.addTypeNode(definitionNode);

                this.setParent(definitionNode);
                definitionNode?.addChild(this);

                return this;
            }
        }

        if (parent) {
            const identifierParent = finder.findParent(this, parent);

            if (identifierParent) {
                this.addTypeNode(identifierParent);

                this.setParent(identifierParent);
                identifierParent?.addChild(this);

                return this;
            }
        }

        // The name "super" and "this" is reserved so we won't add it to orphanNodes
        if (this.getName() === "super" || this.getName() === "this") {
            return this;
        }

        orphanNodes.push(this);

        return this;
    }

    findMemberAccessParent(expressionNode: Node, definitionTypes: Node[]): void {
        for (const definitionType of definitionTypes) {
            for (const definitionChild of definitionType.children) {
                if (isNodeConnectable(definitionChild, expressionNode)) {
                    expressionNode.addTypeNode(definitionChild);

                    expressionNode.setParent(definitionChild);
                    definitionChild?.addChild(expressionNode);

                    // If the parent uri and node uri are not the same, add the node to the exportNode field
                    if (definitionChild && definitionChild.uri !== expressionNode.uri) {
                        const exportRootNode = findSourceUnitNode(definitionChild);
                        const importRootNode = findSourceUnitNode(finder.analyzerTree);

                        if (exportRootNode) {
                            exportRootNode.addExportNode(expressionNode);
                        }

                        if (importRootNode) {
                            importRootNode.addImportNode(expressionNode);
                        }
                    }

                    return;
                }
            }
        }
    }
}
