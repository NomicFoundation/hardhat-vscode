import { FileLevelConstant, FinderType, DocumentsAnalyzerMap, Node } from "@common/types";

export class FileLevelConstantNode extends Node {
    astNode: FileLevelConstant;

    connectionTypeRules: string[] = [ "Identifier" ];

    constructor (fileLevelConstant: FileLevelConstant, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap) {
        super(fileLevelConstant, uri, rootPath, documentsAnalyzer, fileLevelConstant.name);
        this.astNode = fileLevelConstant;

        if (fileLevelConstant.loc && fileLevelConstant.name) {
            this.nameLoc = {
                start: {
                    line: fileLevelConstant.loc.end.line,
                    column: fileLevelConstant.loc.end.column - fileLevelConstant.name.length
                },
                end: {
                    line: fileLevelConstant.loc.end.line,
                    column: fileLevelConstant.loc.end.column
                }
            };
        }
    }

    getDefinitionNode(): Node | undefined {
        return this;
    }

    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node {
        this.setExpressionNode(expression);

        if (parent) {
            this.setParent(parent);
        }

        if (this.astNode.typeName) {
            let typeNode = find(this.astNode.typeName, this.uri, this.rootPath, this.documentsAnalyzer).accept(find, orphanNodes, this);
        
            this.addTypeNode(typeNode);
            this.updateLocationName(typeNode);

            // Find Type of declaration skip MappingNode, ArrayTypeNameNode, FunctionTypeNameNode
            while (![ "UserDefinedTypeName", "ElementaryTypeName" ].includes(typeNode.type)) {
                typeNode = typeNode.typeNodes[0];
            }
            typeNode.setDeclarationNode(this);
        }

        if (this.astNode.initialValue) {
            find(this.astNode.initialValue, this.uri, this.rootPath, this.documentsAnalyzer).accept(find, orphanNodes, parent);
        }

        parent?.addChild(this);

        return this;
    }

    updateLocationName(typeNode: Node): void {
        if (this.astNode.loc && this.nameLoc && typeNode.astNode.range) {
            const diff = 1 + (+typeNode.astNode.range[1] - +typeNode.astNode.range[0]);

            this.nameLoc.start.column = this.astNode.loc.start.column + diff + 1;
            this.nameLoc.end.column = this.nameLoc.start.column + (this.getName()?.length || 0);

            if (this.astNode.isDeclaredConst) {
                this.nameLoc.start.column += "constant ".length;
                this.nameLoc.end.column += "constant ".length;
            }

            if (this.astNode.isImmutable) {
                this.nameLoc.start.column += "immutable ".length;
                this.nameLoc.end.column += "immutable ".length;
            }

            if (this.astNode.loc.end.column < this.nameLoc.end.column) {
                this.astNode.loc.end.column = this.nameLoc.end.column;
            }
        }
    }
}
