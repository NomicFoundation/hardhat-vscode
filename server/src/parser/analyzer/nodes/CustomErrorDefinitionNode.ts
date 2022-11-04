import { findSourceUnitNode } from "@common/utils";
import {
  CustomErrorDefinition,
  FinderType,
  SolFileIndexMap,
  Node,
} from "@common/types";

export class CustomErrorDefinitionNode extends Node {
  public astNode: CustomErrorDefinition;

  public connectionTypeRules: string[] = ["Identifier", "UserDefinedTypeName"];

  constructor(
    customErrorDefinition: CustomErrorDefinition,
    uri: string,
    rootPath: string,
    documentsAnalyzer: SolFileIndexMap
  ) {
    super(
      customErrorDefinition,
      uri,
      rootPath,
      documentsAnalyzer,
      customErrorDefinition.name
    );
    this.astNode = customErrorDefinition;

    if (customErrorDefinition.loc) {
      this.nameLoc = {
        start: {
          line: customErrorDefinition.loc.start.line,
          column: customErrorDefinition.loc.start.column + "error ".length,
        },
        end: {
          line: customErrorDefinition.loc.start.line,
          column:
            customErrorDefinition.loc.start.column +
            "error ".length +
            customErrorDefinition.name.length,
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

    for (const parameter of this.astNode.parameters) {
      await (
        await find(parameter, this.uri, this.rootPath, this.solFileIndex)
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
