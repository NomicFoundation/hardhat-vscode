import * as utils from "@common/utils";
import { FunctionCall, FinderType, DocumentsAnalyzerMap, Node } from "@common/types";

export class FunctionCallNode extends Node {
    astNode: FunctionCall;

    constructor (functionCall: FunctionCall, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap) {
        super(functionCall, uri, rootPath, documentsAnalyzer, undefined);
        this.astNode = functionCall;
    }

    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node {
        this.setExpressionNode(expression);

        if (expression?.type !== "EmitStatement") {
            expression = this;
        }

        const expressionNode = find(this.astNode.expression, this.uri, this.rootPath, this.documentsAnalyzer).accept(find, orphanNodes, parent, expression);

        for (const argument of this.astNode.arguments) {
            find(argument, this.uri, this.rootPath, this.documentsAnalyzer).accept(find, orphanNodes, parent);
        }

        const definitionNodes = expressionNode.getTypeNodes();
        for (const identifier of this.astNode.identifiers) {
            const identifierNode = find(identifier, this.uri, this.rootPath, this.documentsAnalyzer);

            if (definitionNodes.length > 0) {
                this.findParentInExpressionType(identifierNode, definitionNodes);
            }
        }

        return expressionNode;
    }

    private findParentInExpressionType(identifierNode: Node, definitionNodes: Node[]): void {
        for (const definitionNode of definitionNodes) {
            for (const variableDeclarationNode of definitionNode.children) {
                if (utils.isNodeConnectable(variableDeclarationNode, identifierNode)) {
                    identifierNode.addTypeNode(variableDeclarationNode);

                    identifierNode.setParent(variableDeclarationNode);
                    variableDeclarationNode.addChild(identifierNode);
                    return;
                }
            }
        }
    }
}
