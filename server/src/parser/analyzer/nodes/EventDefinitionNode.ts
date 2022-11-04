import { findSourceUnitNode } from "@common/utils";
import {
  EventDefinition,
  FinderType,
  SolFileIndexMap,
  Node,
} from "@common/types";

export class EventDefinitionNode extends Node {
  public astNode: EventDefinition;

  public connectionTypeRules: string[] = ["EmitStatement"];

  constructor(
    eventDefinition: EventDefinition,
    uri: string,
    rootPath: string,
    documentsAnalyzer: SolFileIndexMap
  ) {
    super(
      eventDefinition,
      uri,
      rootPath,
      documentsAnalyzer,
      eventDefinition.name
    );
    this.astNode = eventDefinition;

    if (eventDefinition.loc && eventDefinition.name) {
      this.nameLoc = {
        start: {
          line: eventDefinition.loc.start.line,
          column: eventDefinition.loc.start.column + "event ".length,
        },
        end: {
          line: eventDefinition.loc.start.line,
          column:
            eventDefinition.loc.start.column +
            "event ".length +
            (this.getName()?.length ?? 0),
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
