import { AssemblyFunctionReturns, FinderType, DocumentsAnalyzerMap, Node } from "@common/types";

export class AssemblyFunctionReturnsNode extends Node {
    astNode: AssemblyFunctionReturns;

    constructor (assemblyFunctionReturns: AssemblyFunctionReturns, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap) {
        super(assemblyFunctionReturns, uri, rootPath, documentsAnalyzer);
        this.astNode = assemblyFunctionReturns;
        // TO-DO: Implement name location for rename
    }

    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node {
        this.setExpressionNode(expression);
        // TO-DO: Method not implemented
        return this;
    }
}
