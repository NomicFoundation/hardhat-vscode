import { AssemblyCall, FinderType, SolFileIndexMap, Node } from "@common/types";

export class AssemblyCallNode extends Node {
  public astNode: AssemblyCall;

  constructor(
    assemblyCall: AssemblyCall,
    uri: string,
    rootPath: string,
    documentsAnalyzer: SolFileIndexMap
  ) {
    super(
      assemblyCall,
      uri,
      rootPath,
      documentsAnalyzer,
      assemblyCall.functionName
    );

    if (assemblyCall.loc) {
      // Bug in solidity parser doesn't give exact end location
      assemblyCall.loc.end.column =
        assemblyCall.loc.end.column + assemblyCall.functionName.length;

      this.nameLoc = JSON.parse(JSON.stringify(assemblyCall.loc));
    }

    this.astNode = assemblyCall;
  }

  public async accept(
    find: FinderType,
    orphanNodes: Node[],
    parent?: Node,
    expression?: Node
  ): Promise<Node> {
    this.setExpressionNode(expression);

    for (const argument of this.astNode.arguments ?? []) {
      const foundNode = await find(
        argument,
        this.uri,
        this.rootPath,
        this.solFileIndex
      );
      await foundNode.accept(find, orphanNodes, parent);
    }

    if (parent) {
      const searcher = this.solFileIndex[this.uri]?.searcher;
      const assemblyCallParent = searcher?.findParent(this, parent);

      if (assemblyCallParent) {
        this.addTypeNode(assemblyCallParent);

        this.setParent(assemblyCallParent);
        assemblyCallParent?.addChild(this);

        return this;
      }
    }

    orphanNodes.push(this);

    return this;
  }
}
