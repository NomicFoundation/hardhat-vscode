import { isNodeConnectable, findSourceUnitNode } from "@common/utils";
import {
  UserDefinedTypeName,
  FinderType,
  SolFileIndexMap,
  Node,
  expressionNodeTypes,
} from "@common/types";
import {
  isContractDefinitionNode,
  isFunctionDefinitionNode,
} from "@analyzer/utils/typeGuards";
import { lookupConstructorFor } from "@analyzer/utils/lookups";

export class UserDefinedTypeNameNode extends Node {
  public astNode: UserDefinedTypeName;

  constructor(
    userDefinedTypeName: UserDefinedTypeName,
    uri: string,
    rootPath: string,
    documentsAnalyzer: SolFileIndexMap
  ) {
    super(
      userDefinedTypeName,
      uri,
      rootPath,
      documentsAnalyzer,
      userDefinedTypeName.namePath
    );

    if (userDefinedTypeName.loc) {
      // Bug in solidity parser doesn't give exact end location
      userDefinedTypeName.loc.end.column =
        userDefinedTypeName.loc.end.column +
        userDefinedTypeName.namePath.length;

      this.nameLoc = JSON.parse(JSON.stringify(userDefinedTypeName.loc));
    }

    this.astNode = userDefinedTypeName;
  }

  public setParent(parent: Node | undefined): void {
    this.parent = parent;

    const declarationNode = this.getDeclarationNode();

    for (const child of declarationNode?.children || []) {
      let expressionNode = child.getExpressionNode();
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
  }

  public async accept(
    find: FinderType,
    orphanNodes: Node[],
    parent?: Node,
    expression?: Node
  ): Promise<Node> {
    this.setExpressionNode(expression);

    if (!parent) {
      orphanNodes.push(this);
      return this;
    }

    const searcher = this.solFileIndex[this.uri]?.searcher;
    const definitionParent = searcher?.findParent(this, parent);

    if (!definitionParent) {
      orphanNodes.push(this);
      return this;
    }

    if (
      isContractDefinitionNode(definitionParent) &&
      definitionParent.isAlive &&
      isFunctionDefinitionNode(parent)
    ) {
      const constructorNode = lookupConstructorFor(definitionParent);

      if (constructorNode) {
        this.addTypeNode(definitionParent);
        this.setParent(constructorNode);

        definitionParent?.addChild(this);
        constructorNode.addChild(this);

        return this;
      }
    }

    this.addTypeNode(definitionParent);
    this.setParent(definitionParent);
    definitionParent?.addChild(this);

    return this;
  }

  public findMemberAccessParent(
    expressionNode: Node,
    definitionTypes: Node[]
  ): void {
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

          return;
        }
      }
    }
  }
}
