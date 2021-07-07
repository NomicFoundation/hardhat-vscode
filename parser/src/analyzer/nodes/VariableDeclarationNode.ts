import { findSourceUnitNode } from "@common/utils";
import {
    VariableDeclaration, StateVariableDeclarationVariable, FinderType, Node,
    DocumentsAnalyzerMap, VariableDeclarationNode as IVariableDeclarationNode
} from "@common/types";

export class VariableDeclarationNode extends IVariableDeclarationNode {
    astNode: VariableDeclaration;

    connectionTypeRules: string[] = [ "Identifier", "MemberAccess", "AssemblyCall" ];

    constructor (variableDeclaration: VariableDeclaration, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap) {
        super(variableDeclaration, uri, rootPath, documentsAnalyzer);
        this.astNode = variableDeclaration;

        if (variableDeclaration.loc && variableDeclaration.name) {
            this.nameLoc = {
                start: {
                    line: variableDeclaration.loc.end.line,
                    column: variableDeclaration.loc.end.column - variableDeclaration.name.length
                },
                end: {
                    line: variableDeclaration.loc.end.line,
                    column: variableDeclaration.loc.end.column
                }
            };
        }
    }

    getDefinitionNode(): Node | undefined {
        return this;
    }

    getName(): string | undefined {
        return this.astNode.name || undefined;
    }

    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node {
        this.setExpressionNode(expression);

        if (parent) {
            this.setParent(parent);
        }

        if (this.astNode.typeName) {
            const typeNode = find(this.astNode.typeName, this.uri, this.rootPath, this.documentsAnalyzer).accept(find, orphanNodes, this);

            this.addTypeNode(typeNode);
            typeNode.setDeclarationNode(this);

            this.updateLocationName(typeNode);
        }

        const rootNode = findSourceUnitNode(parent);
        if (rootNode) {
            const searcher = this.documentsAnalyzer[this.uri]?.searcher;
            const exportNodes = new Array(...rootNode.getExportNodes());

            searcher?.findAndAddExportChildren(this, exportNodes);
        }

        // Don't handle expression, it is handled in StateVariableDeclarationNode

        parent?.addChild(this);

        return this;
    }

    updateLocationName(typeNode: Node): void {
        if (this.astNode.loc && this.nameLoc && typeNode.astNode.range) {
            const diff = 1 + (+typeNode.astNode.range[1] - +typeNode.astNode.range[0]);

            this.nameLoc.start.column = this.astNode.loc.start.column + diff + 1;
            this.nameLoc.end.column = this.nameLoc.start.column + (this.getName()?.length || 0);

            if (this.astNode.visibility && this.astNode.visibility !== "default" ) {
                this.nameLoc.start.column += this.astNode.visibility.length + 1;
                this.nameLoc.end.column += this.astNode.visibility.length + 1;
            }

            if (this.astNode.storageLocation) {
                this.nameLoc.start.column += this.astNode.storageLocation.length + 1;
                this.nameLoc.end.column += this.astNode.storageLocation.length + 1;
            }

            if (this.astNode.isDeclaredConst) {
                this.nameLoc.start.column += "constant ".length;
                this.nameLoc.end.column += "constant ".length;
            }

            if ((this.astNode as StateVariableDeclarationVariable).isImmutable) {
                this.nameLoc.start.column += "immutable ".length;
                this.nameLoc.end.column += "immutable ".length;
            }

            if (this.astNode.loc.end.column < this.nameLoc.end.column) {
                this.astNode.loc.end.column = this.nameLoc.end.column;
            }
        }
    }
}
