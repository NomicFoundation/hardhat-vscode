import { findSourceUnitNode } from "@common/utils";
import {
  TypeDefinition,
  FinderType,
  SolFileIndexMap,
  Node,
} from "@common/types";

export class TypeDefinitionNode extends Node {
  public astNode: TypeDefinition;

  public connectionTypeRules: string[] = ["Identifier", "UserDefinedTypeName"];

  constructor(
    typeDefinition: TypeDefinition,
    uri: string,
    rootPath: string,
    documentsAnalyzer: SolFileIndexMap
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
