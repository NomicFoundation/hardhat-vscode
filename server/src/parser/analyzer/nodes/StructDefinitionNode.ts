import { findSourceUnitNode } from "@common/utils";
import {
  StructDefinition,
  FinderType,
  SolFileIndexMap,
  Node,
} from "@common/types";

export class StructDefinitionNode extends Node {
  public astNode: StructDefinition;

  public connectionTypeRules: string[] = [
    "UserDefinedTypeName",
    "MemberAccess",
    "FunctionCall",
  ];

  constructor(
    structDefinition: StructDefinition,
    uri: string,
    rootPath: string,
    documentsAnalyzer: SolFileIndexMap
  ) {
    super(
      structDefinition,
      uri,
      rootPath,
      documentsAnalyzer,
      structDefinition.name
    );
    this.astNode = structDefinition;

    if (structDefinition.loc) {
      this.nameLoc = {
        start: {
          line: structDefinition.loc.start.line,
          column: structDefinition.loc.start.column + "struct ".length,
        },
        end: {
          line: structDefinition.loc.start.line,
          column:
            structDefinition.loc.start.column +
            "struct ".length +
            structDefinition.name.length,
        },
      };
    }

    this.addTypeNode(this);
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

    if (parent) {
      this.setParent(parent);
    }

    for (const member of this.astNode.members) {
      await (
        await find(member, this.uri, this.rootPath, this.solFileIndex)
      ).accept(find, orphanNodes, this);
    }

    const rootNode = findSourceUnitNode(parent);
    const searcher = this.solFileIndex[this.uri]?.searcher;

    if (rootNode) {
      const exportNodes = new Array(...rootNode.getExportNodes());
      searcher?.findAndAddExportChildren(this, exportNodes);
    }

    searcher?.findAndAddChildrenShadowedByParent(this, orphanNodes);

    parent?.addChild(this);

    return this;
  }
}
