import { StateVariableDeclaration, FinderType, Node } from "@common/types";

export class StateVariableDeclarationNode extends Node {
    astNode: StateVariableDeclaration;

    constructor (stateVariableDeclaration: StateVariableDeclaration, uri: string, rootPath: string) {
        super(stateVariableDeclaration, uri, rootPath);
        this.astNode = stateVariableDeclaration;
    }

    getDefinitionNode(): Node | undefined {
        return this;
    }

    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node {
        this.setExpressionNode(expression);

        for (const variable of this.astNode.variables) {
            find(variable, this.uri, this.rootPath).accept(find, orphanNodes, parent);
        }

        if (this.astNode.initialValue) {
            find(this.astNode.initialValue, this.uri, this.rootPath).accept(find, orphanNodes, parent);
        }

        return this;
    }
}
