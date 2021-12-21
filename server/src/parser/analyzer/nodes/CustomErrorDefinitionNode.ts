import { findSourceUnitNode } from "@common/utils";
import {
  CustomErrorDefinition,
  FinderType,
  DocumentsAnalyzerMap,
  Node,
} from "@common/types";

export class CustomErrorDefinitionNode extends Node {
  astNode: CustomErrorDefinition;

  connectionTypeRules: string[] = ["Identifier", "UserDefinedTypeName"];

  constructor(
    customErrorDefinition: CustomErrorDefinition,
    uri: string,
    rootPath: string,
    documentsAnalyzer: DocumentsAnalyzerMap
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

  getTypeNodes(): Node[] {
    return this.typeNodes;
  }

  getDefinitionNode(): Node | undefined {
    return this;
  }

  accept(
    find: FinderType,
    orphanNodes: Node[],
    parent?: Node,
    expression?: Node
  ): Node {
    this.setExpressionNode(expression);

    const searcher = this.documentsAnalyzer[this.uri]?.searcher;

    if (parent) {
      this.setParent(parent);
    }

    for (const parameter of this.astNode.parameters) {
      find(parameter, this.uri, this.rootPath, this.documentsAnalyzer).accept(
        find,
        orphanNodes,
        this
      );
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
