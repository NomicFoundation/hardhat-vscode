import {
  FunctionCall,
  FinderType,
  SolFileIndexMap,
  Node,
  IdentifierNode,
} from "@common/types";

export class FunctionCallNode extends Node {
  public astNode: FunctionCall;

  constructor(
    functionCall: FunctionCall,
    uri: string,
    rootPath: string,
    documentsAnalyzer: SolFileIndexMap
  ) {
    super(functionCall, uri, rootPath, documentsAnalyzer, undefined);
    this.astNode = functionCall;
  }

  public async accept(
    find: FinderType,
    orphanNodes: Node[],
    parent?: Node,
    expression?: Node
  ): Promise<Node> {
    this.setExpressionNode(expression);

    if (expression?.type !== "EmitStatement") {
      expression = this;
    }

    const expressionNode = await (
      await find(
        this.astNode.expression,
        this.uri,
        this.rootPath,
        this.solFileIndex
      )
    ).accept(find, orphanNodes, parent, expression);

    for (const argument of this.astNode.arguments) {
      await (
        await find(argument, this.uri, this.rootPath, this.solFileIndex)
      ).accept(find, orphanNodes, parent);
    }

    const definitionTypes = expressionNode.getTypeNodes();
    const searcher = this.solFileIndex[this.uri]?.searcher;

    for (const identifier of this.astNode.identifiers) {
      const identifierNode = await find(
        identifier,
        this.uri,
        this.rootPath,
        this.solFileIndex
      );

      if (definitionTypes.length > 0) {
        searcher?.findAndAddParentInDefinitionTypeVarialbles(
          identifierNode,
          definitionTypes,
          this.solFileIndex[this.uri]?.analyzerTree.tree
        );
      } else {
        if (expressionNode.type === "Identifier") {
          (expressionNode as IdentifierNode).addIdentifierField(identifierNode);
        }
      }
    }

    return expressionNode;
  }
}
