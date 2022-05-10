import { findSourceUnitNode } from "@common/utils";
import {
  VariableDeclaration,
  FinderType,
  Node,
  DocumentsAnalyzerMap,
  VariableDeclarationNode as AbstractVariableDeclarationNode,
} from "@common/types";

export class VariableDeclarationNode extends AbstractVariableDeclarationNode {
  public astNode: VariableDeclaration;

  public connectionTypeRules: string[] = [
    "Identifier",
    "MemberAccess",
    "AssemblyCall",
  ];

  constructor(
    variableDeclaration: VariableDeclaration,
    uri: string,
    rootPath: string,
    documentsAnalyzer: DocumentsAnalyzerMap
  ) {
    super(
      variableDeclaration,
      uri,
      rootPath,
      documentsAnalyzer,
      variableDeclaration.name ?? undefined
    );
    this.astNode = variableDeclaration;

    if (
      variableDeclaration.identifier?.loc &&
      variableDeclaration.name !== null
    ) {
      this.nameLoc = {
        start: {
          line: variableDeclaration.identifier.loc.start.line,
          column: variableDeclaration.identifier.loc.start.column,
        },
        end: {
          line: variableDeclaration.identifier.loc.start.line,
          column:
            variableDeclaration.identifier.loc.start.column +
            variableDeclaration.name.length,
        },
      };
    }

    this.astNode.loc = this.nameLoc;
  }

  public getDefinitionNode(): Node | undefined {
    return this;
  }

  public accept(
    find: FinderType,
    orphanNodes: Node[],
    parent?: Node,
    expression?: Node
  ): Node {
    this.setExpressionNode(expression);

    if (parent) {
      this.setParent(parent);
    }

    if (this.astNode.typeName) {
      let typeNode = find(
        this.astNode.typeName,
        this.uri,
        this.rootPath,
        this.documentsAnalyzer
      ).accept(find, orphanNodes, this);

      this.addTypeNode(typeNode);

      // Find Type of declaration skip MappingNode, ArrayTypeNameNode, FunctionTypeNameNode
      while (
        // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
        typeNode &&
        !["UserDefinedTypeName", "ElementaryTypeName"].includes(typeNode.type)
      ) {
        typeNode = typeNode.typeNodes[0];
      }

      // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
      if (typeNode) {
        typeNode.setDeclarationNode(this);
      }
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
}
