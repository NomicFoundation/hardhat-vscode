import { ForStatement, FinderType, DocumentsAnalyzerMap, Node } from "@common/types";

export class ForStatementNode extends Node {
    astNode: ForStatement;

    constructor (forStatement: ForStatement, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap) {
        super(forStatement, uri, rootPath, documentsAnalyzer);
        this.astNode = forStatement;
    }

    getDefinitionNode(): Node | undefined {
        return undefined;
    }

    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node {
        this.setExpressionNode(expression);

        if (parent) {
            this.setParent(parent);
        }

        if (this.astNode.initExpression) {
            find(this.astNode.initExpression, this.uri, this.rootPath, this.documentsAnalyzer).accept(find, orphanNodes, this);
        }
        if (this.astNode.conditionExpression) {
            find(this.astNode.conditionExpression, this.uri, this.rootPath, this.documentsAnalyzer).accept(find, orphanNodes, this);
        }
        if (this.astNode.loopExpression) {
            find(this.astNode.loopExpression, this.uri, this.rootPath, this.documentsAnalyzer).accept(find, orphanNodes, this);
        }

        find(this.astNode.body, this.uri, this.rootPath, this.documentsAnalyzer).accept(find, orphanNodes, this);

        parent?.addChild(this);

        return this;
    }
}
