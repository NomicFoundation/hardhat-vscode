import { VariableDeclarationStatement, FinderType, Node } from "@common/types";

export class VariableDeclarationStatementNode extends Node {
    astNode: VariableDeclarationStatement;

    constructor (variableDeclarationStatement: VariableDeclarationStatement, uri: string) {
        super(variableDeclarationStatement, uri);
        this.astNode = variableDeclarationStatement;
    }

    getDefinitionNode(): Node | undefined {
        return this;
    }

    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node {
        this.setExpressionNode(expression);

        for (const variable of this.astNode.variables) {
            if (variable) {
                find(variable, this.uri).accept(find, orphanNodes, parent);
            }
        }

        if (this.astNode.initialValue) {
            find(this.astNode.initialValue, this.uri).accept(find, orphanNodes, parent);
        }

        return this;
    }
}
