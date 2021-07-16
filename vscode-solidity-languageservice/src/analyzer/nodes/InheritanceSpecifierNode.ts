import { InheritanceSpecifier, FinderType, DocumentsAnalyzerMap, Node } from "@common/types";

export class InheritanceSpecifierNode extends Node {
    astNode: InheritanceSpecifier;

    constructor (inheritanceSpecifier: InheritanceSpecifier, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap) {
        super(inheritanceSpecifier, uri, rootPath, documentsAnalyzer, undefined);
        this.astNode = inheritanceSpecifier;
    }

    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node {
        this.setExpressionNode(expression);

        const baseNode = find(this.astNode.baseName, this.uri, this.rootPath, this.documentsAnalyzer).accept(find, orphanNodes, parent);

        for (const argument of this.astNode.arguments) {
            find(argument, this.uri, this.rootPath, this.documentsAnalyzer).accept(find, orphanNodes, parent);
        }

        return baseNode;
    }
}
