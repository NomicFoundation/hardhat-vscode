import * as path from "path";
import * as fs from "fs";

import { resolveDependency } from "@analyzer/resolver";
import {
  ImportDirective,
  FinderType,
  SolFileIndexMap,
  Node,
  SourceUnitNode,
  ImportDirectiveNode as AbstractImportDirectiveNode,
  SolFileState,
} from "@common/types";
import { analyzeSolFile } from "@analyzer/analyzeSolFile";
import { toUnixStyle } from "../../../utils/index";

export class ImportDirectiveNode extends AbstractImportDirectiveNode {
  public realUri: string;

  public uri: string;
  public astNode: ImportDirective;

  constructor(
    importDirective: ImportDirective,
    uri: string,
    rootPath: string,
    documentsAnalyzer: SolFileIndexMap
  ) {
    super(
      importDirective,
      uri,
      rootPath,
      documentsAnalyzer,
      importDirective.path
    );

    this.realUri = toUnixStyle(fs.realpathSync(uri));
    const remappings = documentsAnalyzer[this.realUri]?.project.remappings;

    try {
      this.uri = resolveDependency(
        path.dirname(this.realUri),
        importDirective.path,
        remappings
      );
    } catch (err) {
      this.uri = "";
    }

    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
    if (importDirective.pathLiteral && importDirective.pathLiteral.loc) {
      this.nameLoc = importDirective.pathLiteral.loc;
      this.nameLoc.end.column =
        (this.nameLoc?.end.column || 0) +
        importDirective.pathLiteral.value.length +
        1;
    }

    this.astNode = importDirective;
  }

  public getDefinitionNode(): Node | undefined {
    return this;
  }

  public accept(
    find: FinderType,
    orphanNodes: Node[],
    parent?: Node,
    expression?: Node
  ): Node {
    this.setExpressionNode(expression);

    if (parent) {
      this.setParent(parent);
    }

    const solFileEntry = this.solFileIndex[toUnixStyle(this.uri)];
    if (
      solFileEntry !== undefined &&
      solFileEntry.status !== SolFileState.ANALYZED
    ) {
      analyzeSolFile({ solFileIndex: this.solFileIndex }, solFileEntry);

      // Analyze will change root node so we need to return root node after analyze
      const rootNode = this.solFileIndex[this.realUri]?.analyzerTree.tree;

      if (solFileEntry.isAnalyzed() && rootNode !== undefined) {
        // We transfer orphan nodes from the imported file in case it imports ours and we have a circular dependency.
        // We need to do this since the current analysis is not yet complete so some exported nodes may miss finding a parent.
        // This way we have solved this problem.
        for (const importOrphanNode of solFileEntry.orphanNodes) {
          (solFileEntry.analyzerTree.tree as SourceUnitNode).addImportNode(
            importOrphanNode
          );
          (rootNode as SourceUnitNode).addExportNode(importOrphanNode);
        }
      }
    }

    if (
      solFileEntry?.analyzerTree.tree.type === "SourceUnit" &&
      solFileEntry.analyzerTree.tree.astNode.loc
    ) {
      this.astNode.loc = solFileEntry.analyzerTree.tree.astNode.loc;
    }

    const aliesNodes: Node[] = [];
    for (const symbolAliasesIdentifier of this.astNode
      .symbolAliasesIdentifiers || []) {
      const importedContractNode = find(
        symbolAliasesIdentifier[0],
        this.realUri,
        this.rootPath,
        this.solFileIndex
      ).accept(find, orphanNodes, this);

      // Check if alias exist for importedContractNode
      if (symbolAliasesIdentifier[1]) {
        const importedContractAliasNode = find(
          symbolAliasesIdentifier[1],
          this.realUri,
          this.rootPath,
          this.solFileIndex
        ).accept(find, orphanNodes, importedContractNode, this);
        importedContractAliasNode.setAliasName(importedContractNode.getName());

        aliesNodes.push(importedContractAliasNode);
      } else {
        // Set your name as an alias name
        importedContractNode.setAliasName(importedContractNode.getName());
        aliesNodes.push(importedContractNode);
      }
    }

    for (const aliesNode of aliesNodes) {
      this.addAliasNode(aliesNode);
    }

    parent?.addChild(this);

    return this;
  }
}
