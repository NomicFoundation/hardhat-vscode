import * as parser from "@solidity-parser/parser";
import * as matcher from "@analyzer/matcher";
import {
  Node,
  SourceUnitNode,
  SolFileIndexMap,
  ISolFileEntry,
  SolFileState,
} from "@common/types";

export function analyzeSolFile(
  { solFileIndex }: { solFileIndex: SolFileIndexMap },
  solFileEntry: ISolFileEntry,
  newText?: string
): Node | undefined {
  try {
    solFileEntry.orphanNodes = [];

    if (newText !== undefined) {
      solFileEntry.text = newText;
    }

    try {
      solFileEntry.ast = parser.parse(solFileEntry.text ?? "", {
        loc: true,
        range: true,
        tolerant: true,
      });
    } catch {
      solFileEntry.status = SolFileState.ERRORED;
      return solFileEntry.analyzerTree.tree;
    }

    if (solFileEntry.isAnalyzed()) {
      const oldDocumentsAnalyzerTree = solFileEntry.analyzerTree
        .tree as SourceUnitNode;

      for (const importNode of oldDocumentsAnalyzerTree.getImportNodes()) {
        importNode.getParent()?.removeChild(importNode);
        importNode.setParent(undefined);
      }
    }

    solFileEntry.status = SolFileState.ANALYZED;
    solFileEntry.analyzerTree.tree = matcher
      .find(
        solFileEntry.ast,
        solFileEntry.uri,
        solFileEntry.project.basePath,
        solFileIndex
      )
      .accept(matcher.find, solFileEntry.orphanNodes);

    return solFileEntry.analyzerTree.tree;
  } catch {
    return solFileEntry.analyzerTree.tree;
  }
}
