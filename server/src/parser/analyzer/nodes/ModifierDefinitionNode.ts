import { findSourceUnitNode } from "@common/utils";
import {
  ModifierDefinition,
  FinderType,
  DocumentsAnalyzerMap,
  Node,
} from "@common/types";

export class ModifierDefinitionNode extends Node {
  public astNode: ModifierDefinition;

  public connectionTypeRules: string[] = ["ModifierInvocation"];

  constructor(
    modifierDefinition: ModifierDefinition,
    uri: string,
    rootPath: string,
    documentsAnalyzer: DocumentsAnalyzerMap
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

    for (const override of this.astNode.override || []) {
      find(override, this.uri, this.rootPath, this.documentsAnalyzer).accept(
        find,
        orphanNodes,
        this
      );
    }

    for (const param of this.astNode.parameters || []) {
      find(param, this.uri, this.rootPath, this.documentsAnalyzer).accept(
        find,
        orphanNodes,
        this
      );
    }

    if (this.astNode.body) {
      find(
        this.astNode.body,
        this.uri,
        this.rootPath,
        this.documentsAnalyzer
      ).accept(find, orphanNodes, this);
    }

    const rootNode = findSourceUnitNode(parent);
    const searcher = this.documentsAnalyzer[this.uri]?.searcher;

    if (rootNode) {
      const exportNodes = new Array(...rootNode.getExportNodes());
      searcher?.findAndAddExportChildren(this, exportNodes);
    }

    searcher?.findAndAddChildren(this, orphanNodes);

    parent?.addChild(this);

    return this;
  }
}
