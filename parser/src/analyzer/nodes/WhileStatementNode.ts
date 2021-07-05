import { WhileStatement, FinderType, Node } from "@common/types";

export class WhileStatementNode extends Node {
    astNode: WhileStatement;

    constructor (whileStatement: WhileStatement, uri: string, rootPath: string) {
        super(whileStatement, uri, rootPath);
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

        find(this.astNode.condition, this.uri, this.rootPath).accept(find, orphanNodes, this);
        find(this.astNode.body, this.uri, this.rootPath).accept(find, orphanNodes, this);

        parent?.addChild(this);

        return this;
    }
}
