import {
  ModifierInvocation,
  FinderType,
  DocumentsAnalyzerMap,
  Node,
} from "@common/types";
import { isContractDefinition } from "@analyzer/utils/typeGuards";
import { lookupConstructorFor } from "@analyzer/utils/lookups";

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

    if (!parent) {
      orphanNodes.push(this);
      return this;
    }

    const searcher = this.documentsAnalyzer[this.uri]?.searcher;
    const modifierInvocationParent = searcher?.findParent(this, parent);

    if (!modifierInvocationParent) {
      orphanNodes.push(this);
      return this;
    }

    if (
      isContractDefinition(modifierInvocationParent) &&
      modifierInvocationParent.isAlive
    ) {
      const constructorNode = lookupConstructorFor(modifierInvocationParent);

      if (constructorNode) {
        this.addTypeNode(modifierInvocationParent);
        this.setParent(constructorNode);

        modifierInvocationParent?.addChild(this);
        constructorNode.addChild(this);

        return this;
      }
    }

    this.addTypeNode(modifierInvocationParent);
    this.setParent(modifierInvocationParent);
    modifierInvocationParent?.addChild(this);

    return this;
  }
}
