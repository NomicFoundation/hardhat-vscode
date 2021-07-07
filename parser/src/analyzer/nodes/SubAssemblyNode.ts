import { SubAssembly, FinderType, DocumentsAnalyzerMap, Node } from "@common/types";

export class SubAssemblyNode extends Node {
    astNode: SubAssembly;

    constructor (subAssembly: SubAssembly, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap) {
        super(subAssembly, uri, rootPath, documentsAnalyzer, undefined);
        this.astNode = subAssembly;
        // TO-DO: Implement name location for rename
    }

    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node {
        this.setExpressionNode(expression);
        // TO-DO: Method not implemented
        return this;
    }
}
