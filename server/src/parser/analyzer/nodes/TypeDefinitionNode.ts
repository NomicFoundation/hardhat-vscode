import {findSourceUnitNode} from "@common/utils";
import {
  TypeDefinition,
  FinderType,
  DocumentsAnalyzerMap,
  Node,
} from "@common/types";

export class TypeDefinitionNode extends Node {
  astNode: TypeDefinition;

  connectionTypeRules: string[] = ["Identifier", "UserDefinedTypeName"];

  constructor(
    typeDefinition: TypeDefinition,
    uri: string,
    rootPath: string,
    documentsAnalyzer: DocumentsAnalyzerMap
  ) {
    super(
      typeDefinition,
      uri,
      rootPath,
      documentsAnalyzer,
      typeDefinition.name
    );
    this.astNode = typeDefinition;

    if (typeDefinition?.loc) {
      this.nameLoc = {
        start: {
          line: typeDefinition.loc.start.line,
          column: typeDefinition.loc.start.column + "type ".length,
        },
        end: {
          line: typeDefinition.loc.start.line,
          column:
            typeDefinition.loc.start.column +
            "type ".length +
            typeDefinition.name.length,
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
