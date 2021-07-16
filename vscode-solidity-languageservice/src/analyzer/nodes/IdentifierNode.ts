import { isNodeConnectable, findSourceUnitNode } from "@common/utils";
import {
    Identifier, FinderType, DocumentsAnalyzerMap, Node, expressionNodeTypes
} from "@common/types";

export class IdentifierNode extends Node {
    astNode: Identifier;

    constructor (identifier: Identifier, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap) {
        super(identifier, uri, rootPath, documentsAnalyzer, identifier.name);
        
        if (identifier.loc && identifier.range) {
            // Bug in solidity parser doesn't give exact end location
            identifier.loc.end.column = identifier.loc.end.column + (identifier.range[1] - identifier.range[0]) + 1;

            this.nameLoc = JSON.parse(JSON.stringify(identifier.loc));
        }

        this.astNode = identifier;
    }

    setParent(parent: Node | undefined): void {
        this.parent = parent;

        let expressionNode = this.getExpressionNode();
        if (parent && expressionNode && expressionNodeTypes.includes(expressionNode.type)) {
            if (expressionNode.type !== "MemberAccess") {
                expressionNode = expressionNode.getExpressionNode();
            }

            if (expressionNode && expressionNode.type === "MemberAccess") {
                const definitionTypes = parent.getTypeNodes();

                this.findMemberAccessParent(expressionNode, definitionTypes);
            }
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
            const searcher = this.documentsAnalyzer[this.uri]?.searcher;
            const identifierParent = searcher?.findParent(this, parent);

            if (identifierParent) {
                this.addTypeNode(identifierParent);

                this.setParent(identifierParent);
                identifierParent?.addChild(this);

                return this;
            }
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
                        const importRootNode = findSourceUnitNode(this.documentsAnalyzer[this.uri]?.analyzerTree.tree);

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
