import { findSourceUnitNode } from "@common/utils";
import { EnumDefinition, FinderType, DocumentsAnalyzerMap, Node } from "@common/types";

export class EnumDefinitionNode extends Node {
    astNode: EnumDefinition;

    connectionTypeRules: string[] = [ "Identifier", "UserDefinedTypeName" ];

    constructor (enumDefinition: EnumDefinition, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap) {
        super(enumDefinition, uri, rootPath, documentsAnalyzer);
        this.astNode = enumDefinition;

        if (enumDefinition.loc) {
            this.nameLoc = {
                start: {
                    line: enumDefinition.loc.start.line,
                    column: enumDefinition.loc.start.column + "enum ".length
                },
                end: {
                    line: enumDefinition.loc.start.line,
                    column: enumDefinition.loc.start.column + "enum ".length + enumDefinition.name.length
                }
            };
        }

        this.addTypeNode(this);
    }

    getTypeNodes(): Node[] {
        return this.typeNodes;
    }

    getDefinitionNode(): Node | undefined {
        return this;
    }

    getName(): string | undefined {
        return this.astNode.name;
    }

    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node {
        this.setExpressionNode(expression);

        const searcher = this.documentsAnalyzer[this.uri]?.searcher;

        if (parent) {
            this.setParent(parent);
        }

        for (const member of this.astNode.members) {
            find(member, this.uri, this.rootPath, this.documentsAnalyzer).accept(find, orphanNodes, this);
        }

        const rootNode = findSourceUnitNode(parent);
        if (rootNode) {
            const exportNodes = new Array(...rootNode.getExportNodes());
            searcher?.findAndAddExportChildren(this, exportNodes);
        }

        searcher?.findAndAddChildren(this, orphanNodes);

        parent?.addChild(this);

        return this;
    }
}
