import { WhileStatement, FinderType, Node } from "@common/types";

export class WhileStatementNode extends Node {
    astNode: WhileStatement;

    constructor (whileStatement: WhileStatement, uri: string) {
        super(whileStatement, uri);
        this.astNode = whileStatement;
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
        find(this.astNode.body, this.uri).accept(find, orphanNodes, this);

        parent?.addChild(this);

        return this;
    }
}
