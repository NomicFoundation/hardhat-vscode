import { DoWhileStatement, FinderType, DocumentsAnalyzerMap, Node } from "@common/types";

export class DoWhileStatementNode extends Node {
    astNode: DoWhileStatement;

    constructor (doWhileStatement: DoWhileStatement, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap) {
        super(doWhileStatement, uri, rootPath, documentsAnalyzer, undefined);
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

        find(this.astNode.condition, this.uri, this.rootPath, this.documentsAnalyzer).accept(find, orphanNodes, this);
        find(this.astNode.body, this.uri, this.rootPath, this.documentsAnalyzer).accept(find, orphanNodes, this);

        parent?.addChild(this);

        return this;
    }
}
