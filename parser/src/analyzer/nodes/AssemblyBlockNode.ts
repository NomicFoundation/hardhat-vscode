import { AssemblyBlock, FinderType, DocumentsAnalyzerMap, Node } from "@common/types";

export class AssemblyBlockNode extends Node {
    astNode: AssemblyBlock;

    constructor (assemblyBlock: AssemblyBlock, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap) {
        super(assemblyBlock, uri, rootPath, documentsAnalyzer);
        this.astNode = assemblyBlock;
    }

    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node {
        this.setExpressionNode(expression);

        if (parent) {
            this.setParent(parent);
        }

        for (const operation of this.astNode.operations || []) {
            find(operation, this.uri, this.rootPath, this.documentsAnalyzer).accept(find, orphanNodes, this);
        }

        parent?.addChild(this);

        return this;
    }
}
