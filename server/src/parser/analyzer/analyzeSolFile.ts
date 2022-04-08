import * as parser from "@solidity-parser/parser";
import * as matcher from "@analyzer/matcher";
import {
  Node,
  SourceUnitNode,
  DocumentsAnalyzerMap,
  ISolFileEntry,
  SolFileState,
} from "@common/types";

export function analyzeSolFile(
  solFileEntry: ISolFileEntry,
  solFileIndex: DocumentsAnalyzerMap,
  text?: string
): Node | undefined {
  try {
    solFileEntry.orphanNodes = [];

    if (text) {
      solFileEntry.document = text;
    }

    try {
      solFileEntry.ast = parser.parse(solFileEntry.document || "", {
        loc: true,
        range: true,
        tolerant: true,
      });
    } catch {
      solFileEntry.status = SolFileState.Errored;
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

    solFileEntry.status = SolFileState.Analyzed;
    solFileEntry.analyzerTree.tree = matcher
      .find(
        solFileEntry.ast,
        solFileEntry.uri,
        solFileEntry.rootPath,
        solFileIndex
      )
      .accept(matcher.find, solFileEntry.orphanNodes);

    return solFileEntry.analyzerTree.tree;
  } catch {
    return solFileEntry.analyzerTree.tree;
  }
}
