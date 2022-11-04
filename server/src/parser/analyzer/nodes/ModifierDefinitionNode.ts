import { findSourceUnitNode } from "@common/utils";
import {
  ModifierDefinition,
  FinderType,
  SolFileIndexMap,
  Node,
} from "@common/types";

export class ModifierDefinitionNode extends Node {
  public astNode: ModifierDefinition;

  public connectionTypeRules: string[] = ["ModifierInvocation"];

  constructor(
    modifierDefinition: ModifierDefinition,
    uri: string,
    rootPath: string,
    documentsAnalyzer: SolFileIndexMap
  ) {
    super(
      modifierDefinition,
      uri,
      rootPath,
      documentsAnalyzer,
      modifierDefinition.name
    );
    this.astNode = modifierDefinition;

    if (modifierDefinition.loc) {
      this.nameLoc = {
        start: {
          line: modifierDefinition.loc.start.line,
          column: modifierDefinition.loc.start.column + "modifier ".length,
        },
        end: {
          line: modifierDefinition.loc.start.line,
          column:
            modifierDefinition.loc.start.column +
            "modifier ".length +
            modifierDefinition.name.length,
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

    for (const override of this.astNode.override || []) {
      await (
        await find(override, this.uri, this.rootPath, this.solFileIndex)
      ).accept(find, orphanNodes, this);
    }

    for (const param of this.astNode.parameters || []) {
      await (
        await find(param, this.uri, this.rootPath, this.solFileIndex)
      ).accept(find, orphanNodes, this);
    }

    if (this.astNode.body) {
      await (
        await find(
          this.astNode.body,
          this.uri,
          this.rootPath,
          this.solFileIndex
        )
      ).accept(find, orphanNodes, this);
    }

    const rootNode = findSourceUnitNode(parent);
    const searcher = this.solFileIndex[this.uri]?.searcher;

    if (rootNode) {
      const exportNodes = new Array(...rootNode.getExportNodes());
      searcher?.findAndAddExportChildren(this, exportNodes);
    }

    searcher?.findAndAddChildren(this, orphanNodes);

    parent?.addChild(this);

    return this;
  }
}
