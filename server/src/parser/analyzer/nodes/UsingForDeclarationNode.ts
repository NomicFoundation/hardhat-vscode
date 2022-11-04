import {
  UsingForDeclaration,
  FinderType,
  SolFileIndexMap,
  Node,
} from "@common/types";

export class UsingForDeclarationNode extends Node {
  public astNode: UsingForDeclaration;

  public connectionTypeRules: string[] = ["ContractDefinition"];

  constructor(
    usingForDeclaration: UsingForDeclaration,
    uri: string,
    rootPath: string,
    documentsAnalyzer: SolFileIndexMap
  ) {
    super(
      usingForDeclaration,
      uri,
      rootPath,
      documentsAnalyzer,
      usingForDeclaration.libraryName
    );
    this.astNode = usingForDeclaration;

    if (usingForDeclaration.loc && usingForDeclaration.libraryName) {
      this.nameLoc = {
        start: {
          line: usingForDeclaration.loc.start.line,
          column: usingForDeclaration.loc.start.column + "using ".length,
        },
        end: {
          line: usingForDeclaration.loc.start.line,
          column:
            usingForDeclaration.loc.start.column +
            "using ".length +
            (this.getName()?.length ?? 0),
        },
      };
    }
  }

  public async accept(
    find: FinderType,
    orphanNodes: Node[],
    parent?: Node,
    expression?: Node
  ): Promise<Node> {
    this.setExpressionNode(expression);

    if (this.astNode.typeName) {
      await (
        await find(
          this.astNode.typeName,
          this.uri,
          this.rootPath,
          this.solFileIndex
        )
      ).accept(find, orphanNodes, parent);
    }

    if (parent) {
      const searcher = this.solFileIndex[this.uri]?.searcher;
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
