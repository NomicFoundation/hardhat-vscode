import { findSourceUnitNode } from "@common/utils";
import {
  EnumDefinition,
  FinderType,
  SolFileIndexMap,
  Node,
} from "@common/types";

export class EnumDefinitionNode extends Node {
  public astNode: EnumDefinition;

  public connectionTypeRules: string[] = ["Identifier", "UserDefinedTypeName"];

  constructor(
    enumDefinition: EnumDefinition,
    uri: string,
    rootPath: string,
    documentsAnalyzer: SolFileIndexMap
  ) {
    super(
      enumDefinition,
      uri,
      rootPath,
      documentsAnalyzer,
      enumDefinition.name
    );
    this.astNode = enumDefinition;

    if (enumDefinition.loc) {
      this.nameLoc = {
        start: {
          line: enumDefinition.loc.start.line,
          column: enumDefinition.loc.start.column + "enum ".length,
        },
        end: {
          line: enumDefinition.loc.start.line,
          column:
            enumDefinition.loc.start.column +
            "enum ".length +
            enumDefinition.name.length,
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

    const searcher = this.solFileIndex[this.uri]?.searcher;

    if (parent) {
      this.setParent(parent);
    }

    for (const member of this.astNode.members) {
      await (
        await find(member, this.uri, this.rootPath, this.solFileIndex)
      ).accept(find, orphanNodes, this);
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
