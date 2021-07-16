import { AssemblyCase, FinderType, DocumentsAnalyzerMap, Node } from "@common/types";

export class AssemblyCaseNode extends Node {
    astNode: AssemblyCase;

    constructor (assemblyCase: AssemblyCase, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap) {
        super(assemblyCase, uri, rootPath, documentsAnalyzer, undefined);
        this.astNode = assemblyCase;
    }

    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node {
        this.setExpressionNode(expression);

        if (parent) {
            this.setParent(parent);
        }

        if (this.astNode.value) {
            find(this.astNode.value, this.uri, this.rootPath, this.documentsAnalyzer).accept(find, orphanNodes, this);
        }

        find(this.astNode.block, this.uri, this.rootPath, this.documentsAnalyzer).accept(find, orphanNodes, this);

        parent?.addChild(this);

        return this;
    }
}
