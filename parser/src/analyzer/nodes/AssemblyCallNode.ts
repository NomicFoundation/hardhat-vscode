import { AssemblyCall, FinderType, DocumentsAnalyzerMap, Node } from "@common/types";

export class AssemblyCallNode extends Node {
    astNode: AssemblyCall;

    constructor (assemblyCall: AssemblyCall, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap) {
        super(assemblyCall, uri, rootPath, documentsAnalyzer, assemblyCall.functionName);

        if (assemblyCall.loc) {
            // Bug in solidity parser doesn't give exact end location
            assemblyCall.loc.end.column = assemblyCall.loc.end.column + assemblyCall.functionName.length;

            this.nameLoc = JSON.parse(JSON.stringify(assemblyCall.loc));
        }

        this.astNode = assemblyCall;
    }

    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node {
        this.setExpressionNode(expression);

        for (const argument of this.astNode.arguments || []) {
            find(argument, this.uri, this.rootPath, this.documentsAnalyzer).accept(find, orphanNodes, parent);
        }

        if (parent) {
            const searcher = this.documentsAnalyzer[this.uri]?.searcher;
            const assemblyCallParent = searcher?.findParent(this, parent);

            if (assemblyCallParent) {
                this.addTypeNode(assemblyCallParent);

                this.setParent(assemblyCallParent);
                assemblyCallParent?.addChild(this);

                return this;
            }
        }

        orphanNodes.push(this);

        return this;
    }
}
