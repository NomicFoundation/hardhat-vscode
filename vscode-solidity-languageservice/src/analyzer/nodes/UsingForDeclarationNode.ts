import { UsingForDeclaration, FinderType, DocumentsAnalyzerMap, Node } from "@common/types";

export class UsingForDeclarationNode extends Node {
    astNode: UsingForDeclaration;

    connectionTypeRules: string[] = [ "ContractDefinition" ];

    constructor (usingForDeclaration: UsingForDeclaration, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap) {
        super(usingForDeclaration, uri, rootPath, documentsAnalyzer, usingForDeclaration.libraryName);
        this.astNode = usingForDeclaration;

        if (usingForDeclaration.loc && usingForDeclaration.libraryName) {
            this.nameLoc = {
                start: {
                    line: usingForDeclaration.loc.start.line,
                    column: usingForDeclaration.loc.start.column + "using ".length
                },
                end: {
                    line: usingForDeclaration.loc.start.line,
                    column: usingForDeclaration.loc.start.column + "using ".length + (this.getName()?.length || 0)
                }
            };
        }
    }

    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node {
        this.setExpressionNode(expression);

        if (this.astNode.typeName) {
            find(this.astNode.typeName, this.uri, this.rootPath, this.documentsAnalyzer).accept(find, orphanNodes, parent);
        }

        if (parent) {
            const searcher = this.documentsAnalyzer[this.uri]?.searcher;
            const identifierParent = searcher?.findParent(this, parent);

            if (identifierParent) {
                this.addTypeNode(identifierParent);

                this.setParent(identifierParent);
                identifierParent?.addChild(this);

                return this;
            }
        }

        orphanNodes.push(this);

        return this;
    }
}
