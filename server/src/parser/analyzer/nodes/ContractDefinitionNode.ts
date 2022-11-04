import { findSourceUnitNode } from "@common/utils";
import {
  ContractDefinition,
  FinderType,
  SolFileIndexMap,
  Node,
  ContractDefinitionNode as AbstractContractDefinitionNode,
} from "@common/types";

export class ContractDefinitionNode extends AbstractContractDefinitionNode {
  public astNode: ContractDefinition;

  public connectionTypeRules: string[] = [
    "Identifier",
    "UserDefinedTypeName",
    "FunctionCall",
    "UsingForDeclaration",
    "ModifierInvocation",
  ];

  constructor(
    contractDefinition: ContractDefinition,
    uri: string,
    rootPath: string,
    documentsAnalyzer: SolFileIndexMap
  ) {
    super(
      contractDefinition,
      uri,
      rootPath,
      documentsAnalyzer,
      contractDefinition.name
    );
    this.astNode = contractDefinition;

    if (contractDefinition.loc) {
      const escapePrefix =
        contractDefinition.kind === "abstract"
          ? "abstract contract ".length
          : contractDefinition.kind.length + 1;
      this.nameLoc = {
        start: {
          line: contractDefinition.loc.start.line,
          column: contractDefinition.loc.start.column + escapePrefix,
        },
        end: {
          line: contractDefinition.loc.start.line,
          column:
            contractDefinition.loc.start.column +
            escapePrefix +
            contractDefinition.name.length,
        },
      };
    }

    this.addTypeNode(this);
  }

  public getKind(): string {
    return this.astNode.kind;
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

    for (const baseContract of this.astNode.baseContracts) {
      const inheritanceNode = await (
        await find(baseContract, this.uri, this.rootPath, this.solFileIndex)
      ).accept(find, orphanNodes, this);

      const inheritanceNodeDefinition = inheritanceNode.getDefinitionNode();

      if (
        inheritanceNodeDefinition &&
        inheritanceNodeDefinition instanceof ContractDefinitionNode
      ) {
        this.inheritanceNodes.push(inheritanceNodeDefinition);
      }
    }

    for (const subNode of this.astNode.subNodes) {
      await (
        await find(subNode, this.uri, this.rootPath, this.solFileIndex)
      ).accept(find, orphanNodes, this);
    }

    // Find parent for orphanNodes from this contract in inheritance Nodes
    this.findParentForOrphanNodesInInheritanceNodes(orphanNodes);

    const rootNode = findSourceUnitNode(parent);
    if (rootNode) {
      const exportNodes = new Array(...rootNode.getExportNodes());
      searcher?.findAndAddExportChildren(this, exportNodes);
    }

    searcher?.findAndAddChildren(this, orphanNodes, false);

    parent?.addChild(this);

    return this;
  }

  public findParentForOrphanNodesInInheritanceNodes(orphanNodes: Node[]): void {
    const searcher = this.solFileIndex[this.uri]?.searcher;
    const newOrphanNodes: Node[] = [];

    let orphanNode = orphanNodes.shift();
    while (orphanNode) {
      if (
        this.astNode.loc &&
        orphanNode.astNode.loc &&
        this.astNode.loc.start.line <= orphanNode.astNode.loc.start.line &&
        this.astNode.loc.end.line >= orphanNode.astNode.loc.end.line
      ) {
        const nodeParent = searcher?.findParent(orphanNode, this, true);

        if (nodeParent) {
          orphanNode.addTypeNode(nodeParent);

          orphanNode.setParent(nodeParent);
          nodeParent?.addChild(orphanNode);
        } else {
          newOrphanNodes.push(orphanNode);
        }
      } else {
        newOrphanNodes.push(orphanNode);
      }

      orphanNode = orphanNodes.shift();
    }

    // Return to orphanNodes array unhandled orphan nodes
    for (const newOrphanNode of newOrphanNodes) {
      orphanNodes.push(newOrphanNode);
    }
  }
}
