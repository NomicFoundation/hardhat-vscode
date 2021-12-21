import {
  ModifierInvocation,
  FinderType,
  DocumentsAnalyzerMap,
  Node,
} from "@common/types";

export class ModifierInvocationNode extends Node {
  astNode: ModifierInvocation;

  constructor(
    modifierInvocation: ModifierInvocation,
    uri: string,
    rootPath: string,
    documentsAnalyzer: DocumentsAnalyzerMap
  ) {
    super(
      modifierInvocation,
      uri,
      rootPath,
      documentsAnalyzer,
      modifierInvocation.name
    );
    this.astNode = modifierInvocation;

    if (modifierInvocation.loc) {
      this.nameLoc = {
        start: {
          line: modifierInvocation.loc.start.line,
          column: modifierInvocation.loc.start.column,
        },
        end: {
          line: modifierInvocation.loc.start.line,
          column:
            modifierInvocation.loc.start.column +
            modifierInvocation.name.length,
        },
      };
    }
  }

  accept(
    find: FinderType,
    orphanNodes: Node[],
    parent?: Node,
    expression?: Node
  ): Node {
    this.setExpressionNode(expression);

    for (const argument of this.astNode.arguments || []) {
      find(argument, this.uri, this.rootPath, this.documentsAnalyzer).accept(
        find,
        orphanNodes,
        parent
      );
    }

    if (parent) {
      const searcher = this.documentsAnalyzer[this.uri]?.searcher;
      const modifierInvocationParent = searcher?.findParent(this, parent);

      if (modifierInvocationParent) {
        this.addTypeNode(modifierInvocationParent);

        this.setParent(modifierInvocationParent);
        modifierInvocationParent?.addChild(this);

        return this;
      }
    }

    orphanNodes.push(this);

    return this;
  }
}
