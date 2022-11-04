import { isNodeConnectable, findSourceUnitNode } from "@common/utils";
import {
  MemberAccess,
  FinderType,
  SolFileIndexMap,
  ContractDefinitionNode,
  Node,
  MemberAccessNode as IMemberAccessNode,
  expressionNodeTypes,
} from "@common/types";

export class MemberAccessNode extends IMemberAccessNode {
  public astNode: MemberAccess;

  constructor(
    memberAccess: MemberAccess,
    uri: string,
    rootPath: string,
    documentsAnalyzer: SolFileIndexMap
  ) {
    super(
      memberAccess,
      uri,
      rootPath,
      documentsAnalyzer,
      memberAccess.memberName
    );

    if (memberAccess.loc) {
      // Bug in solidity parser doesn't give exact locations
      memberAccess.loc.start.line = memberAccess.loc.end.line;
      memberAccess.loc.start.column = memberAccess.loc.end.column;
      memberAccess.loc.end.column =
        memberAccess.loc.end.column + (memberAccess.memberName.length || 1);

      this.nameLoc = JSON.parse(JSON.stringify(memberAccess.loc));
    }

    this.astNode = memberAccess;
  }

  public setParent(parent: Node | undefined): void {
    this.parent = parent;

    let expressionNode = this.getExpressionNode();
    if (
      parent &&
      expressionNode &&
      expressionNodeTypes.includes(expressionNode.type)
    ) {
      if (expressionNode.type !== "MemberAccess") {
        expressionNode = expressionNode.getExpressionNode();
      }

      if (expressionNode && expressionNode.type === "MemberAccess") {
        const definitionTypes = parent.getTypeNodes();

        this.findMemberAccessParent(expressionNode, definitionTypes);
      }
    }
  }

  public async accept(
    find: FinderType,
    orphanNodes: Node[],
    parent?: Node,
    expression?: Node
  ): Promise<Node> {
    this.setExpressionNode(expression);

    const expressionNode = await (
      await find(
        this.astNode.expression,
        this.uri,
        this.rootPath,
        this.solFileIndex
      )
    ).accept(find, orphanNodes, parent, this);
    this.setPreviousMemberAccessNode(expressionNode);

    if (!expressionNode.parent) {
      const definitionTypes = expressionNode.getTypeNodes();
      const handled = this.findMemberAccessParent(
        expressionNode,
        definitionTypes
      );
      if (handled) {
        return handled;
      }
    }

    // The Identifier name "super" is reserved, so we will try to find the parent for this Node in inheritance Nodes
    if (
      expressionNode.getName() === "super" &&
      expressionNode.type === "Identifier"
    ) {
      let contractDefinitionNode = parent;

      while (
        contractDefinitionNode &&
        contractDefinitionNode.type !== "ContractDefinition"
      ) {
        contractDefinitionNode = contractDefinitionNode.getParent();
      }

      const searcher = this.solFileIndex[this.uri]?.searcher;
      const inheritanceNodes = (
        contractDefinitionNode as ContractDefinitionNode
      ).getInheritanceNodes();

      for (let i = inheritanceNodes.length - 1; i >= 0; i--) {
        const inheritanceNode = inheritanceNodes[i];

        const memberAccessParent = searcher?.findParent(
          this,
          inheritanceNode,
          true
        );

        if (memberAccessParent) {
          this.addTypeNode(memberAccessParent);

          this.setParent(memberAccessParent);
          memberAccessParent?.addChild(this);

          return this;
        }
      }
    }

    // The Identifier name "this" is reserved, so we will try to find the parent for this Node in contract first layer
    if (
      expressionNode.getName() === "this" &&
      expressionNode.type === "Identifier"
    ) {
      let contractDefinitionNode = parent;

      while (
        contractDefinitionNode &&
        contractDefinitionNode.type !== "ContractDefinition"
      ) {
        contractDefinitionNode = contractDefinitionNode.getParent();
      }

      const searcher = this.solFileIndex[this.uri]?.searcher;
      const memberAccessParent = searcher?.findParent(
        this,
        contractDefinitionNode,
        true
      );

      if (memberAccessParent) {
        this.addTypeNode(memberAccessParent);

        this.setParent(memberAccessParent);
        memberAccessParent?.addChild(this);

        return this;
      }
    }

    // Never add MemberAccessNode to orphanNodes because it is handled via expression

    return this;
  }

  public findMemberAccessParent(
    expressionNode: Node,
    definitionTypes: Node[]
  ): Node | undefined {
    for (const definitionType of definitionTypes) {
      for (const definitionChild of definitionType.children) {
        if (isNodeConnectable(definitionChild, expressionNode)) {
          expressionNode.addTypeNode(definitionChild);

          expressionNode.setParent(definitionChild);
          definitionChild?.addChild(expressionNode);

          // If the parent uri and node uri are not the same, add the node to the exportNode field
          // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
          if (definitionChild && definitionChild.uri !== expressionNode.uri) {
            const exportRootNode = findSourceUnitNode(definitionChild);
            const importRootNode = findSourceUnitNode(
              this.solFileIndex[this.uri]?.analyzerTree.tree
            );

            if (exportRootNode) {
              exportRootNode.addExportNode(expressionNode);
            }

            if (importRootNode) {
              importRootNode.addImportNode(expressionNode);
            }
          }

          return this;
        }
      }
    }

    return undefined;
  }
}
