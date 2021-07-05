import { DoWhileStatement, FinderType, Node } from "@common/types";

export class DoWhileStatementNode extends Node {
    astNode: DoWhileStatement;

    constructor (doWhileStatement: DoWhileStatement, uri: string, rootPath: string) {
        super(doWhileStatement, uri, rootPath);
        this.astNode = doWhileStatement;
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
