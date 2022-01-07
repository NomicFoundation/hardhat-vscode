import { findSourceUnitNode } from "@common/utils";
import {
  EventDefinition,
  FinderType,
  DocumentsAnalyzerMap,
  Node,
} from "@common/types";

export class EventDefinitionNode extends Node {
  astNode: EventDefinition;

  connectionTypeRules: string[] = ["EmitStatement"];

  constructor(
    eventDefinition: EventDefinition,
    uri: string,
    rootPath: string,
    documentsAnalyzer: DocumentsAnalyzerMap
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
            (this.getName()?.length || 0),
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
