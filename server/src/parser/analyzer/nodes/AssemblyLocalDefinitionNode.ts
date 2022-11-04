import {
  AssemblyLocalDefinition,
  FinderType,
  SolFileIndexMap,
  Node,
} from "@common/types";

export class AssemblyLocalDefinitionNode extends Node {
  public astNode: AssemblyLocalDefinition;

  public connectionTypeRules: string[] = ["AssemblyCall", "Identifier"];

  constructor(
    assemblyLocalDefinition: AssemblyLocalDefinition,
    uri: string,
    rootPath: string,
    documentsAnalyzer: SolFileIndexMap,
    parent?: Node,
    identifierNode?: Node
  ) {
    super(assemblyLocalDefinition, uri, rootPath, documentsAnalyzer, undefined);
    this.astNode = assemblyLocalDefinition;

    if (parent && identifierNode) {
      this.setParent(parent);

      this.nameLoc = identifierNode.nameLoc;
      this.name = identifierNode.getName();

      parent.addChild(this);
    }
  }

  public getTypeNodes(): Node[] {
    return this.typeNodes;
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

    for (const name of this.astNode.names ?? []) {
      const identifierNode = await find(
        name,
        this.uri,
        this.rootPath,
        this.solFileIndex
      );

      new AssemblyLocalDefinitionNode(
        this.astNode,
        identifierNode.uri,
        identifierNode.rootPath,
        identifierNode.solFileIndex,
        parent,
        identifierNode
      );
    }

    if (this.astNode.expression) {
      await (
        await find(
          this.astNode.expression,
          this.uri,
          this.rootPath,
          this.solFileIndex
        )
      ).accept(find, orphanNodes, parent);
    }

    return this;
  }
}
