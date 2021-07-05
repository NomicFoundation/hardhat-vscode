import { AssemblyLiteral, FinderType, DocumentsAnalyzerMap, Node } from "@common/types";

export class AssemblyLiteralNode extends Node {
    astNode: AssemblyLiteral;

    constructor (assemblyLiteral: AssemblyLiteral, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap) {
        super(assemblyLiteral, uri, rootPath, documentsAnalyzer);
        this.astNode = assemblyLiteral;
        // TO-DO: Implement name location for rename
    }

    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node {
        this.setExpressionNode(expression);
        // TO-DO: Method not implemented
        return this;
    }
}
