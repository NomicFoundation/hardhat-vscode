import { findSourceUnitNode } from "@common/utils";
import {
  VariableDeclaration,
  FinderType,
  Node,
  SolFileIndexMap,
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
    documentsAnalyzer: SolFileIndexMap
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

  public async accept(
    find: FinderType,
    orphanNodes: Node[],
    parent?: Node,
    expression?: Node
  ): Promise<Node> {
    this.setExpressionNode(expression);

    if (parent) {
      this.setParent(parent);
    }

    if (this.astNode.typeName) {
      let typeNode = await (
        await find(
          this.astNode.typeName,
          this.uri,
          this.rootPath,
          this.solFileIndex
        )
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
      const searcher = this.solFileIndex[this.uri]?.searcher;
      const exportNodes = new Array(...rootNode.getExportNodes());

      searcher?.findAndAddExportChildren(this, exportNodes);
    }

    // Don't handle expression, it is handled in StateVariableDeclarationNode

    parent?.addChild(this);

    return this;
  }
}
