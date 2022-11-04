import {
  ModifierInvocation,
  FinderType,
  SolFileIndexMap,
  Node,
} from "@common/types";
import { isContractDefinitionNode } from "@analyzer/utils/typeGuards";
import { lookupConstructorFor } from "@analyzer/utils/lookups";

export class ModifierInvocationNode extends Node {
  public astNode: ModifierInvocation;

  constructor(
    modifierInvocation: ModifierInvocation,
    uri: string,
    rootPath: string,
    documentsAnalyzer: SolFileIndexMap
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

  public async accept(
    find: FinderType,
    orphanNodes: Node[],
    parent?: Node,
    expression?: Node
  ): Promise<Node> {
    this.setExpressionNode(expression);

    for (const argument of this.astNode.arguments || []) {
      await (
        await find(argument, this.uri, this.rootPath, this.solFileIndex)
      ).accept(find, orphanNodes, parent);
    }

    if (!parent) {
      orphanNodes.push(this);
      return this;
    }

    const searcher = this.solFileIndex[this.uri]?.searcher;
    const modifierInvocationParent = searcher?.findParent(this, parent);

    if (!modifierInvocationParent) {
      orphanNodes.push(this);
      return this;
    }

    if (
      isContractDefinitionNode(modifierInvocationParent) &&
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
