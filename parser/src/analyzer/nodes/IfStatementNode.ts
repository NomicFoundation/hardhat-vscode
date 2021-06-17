import { IfStatement, FinderType, Node } from "@common/types";

export class IfStatementNode extends Node {
    astNode: IfStatement;

    constructor (ifStatement: IfStatement, uri: string) {
        super(ifStatement, uri);
        this.astNode = ifStatement;
    }

    getDefinitionNode(): Node | undefined {
        return undefined;
    }

    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node {
        this.setExpressionNode(expression);

        if (parent) {
            this.setParent(parent);
        }

        find(this.astNode.condition, this.uri).accept(find, orphanNodes, this);
        find(this.astNode.trueBody, this.uri).accept(find, orphanNodes, this);

        if (this.astNode.falseBody) {
            find(this.astNode.falseBody, this.uri).accept(find, orphanNodes, this);
        }

        parent?.addChild(this);

        return this;
    }
}
