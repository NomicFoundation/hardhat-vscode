import * as parser from "@solidity-parser/parser";
import * as matcher from "@analyzer/matcher";
import { Node, SourceUnitNode, DocumentsAnalyzerMap } from "@common/types";
import { DocumentAnalyzer } from "./DocumentAnalyzer";

export function analyzeSolFile(
  documentAnalyzer: DocumentAnalyzer,
  solFileIndex: DocumentsAnalyzerMap,
  document?: string
): Node | undefined {
  try {
    documentAnalyzer.orphanNodes = [];

    if (document) {
      documentAnalyzer.document = document;
    }

    try {
      documentAnalyzer.ast = parser.parse(documentAnalyzer.document || "", {
        loc: true,
        range: true,
        tolerant: true,
      });
    } catch {
      return documentAnalyzer.analyzerTree.tree;
    }

    if (documentAnalyzer.isAnalyzed) {
      const oldDocumentsAnalyzerTree = documentAnalyzer.analyzerTree
        .tree as SourceUnitNode;

      for (const importNode of oldDocumentsAnalyzerTree.getImportNodes()) {
        importNode.getParent()?.removeChild(importNode);
        importNode.setParent(undefined);
      }
    }

    documentAnalyzer.isAnalyzed = true;
    documentAnalyzer.analyzerTree.tree = matcher
      .find(
        documentAnalyzer.ast,
        documentAnalyzer.uri,
        documentAnalyzer.rootPath,
        solFileIndex
      )
      .accept(matcher.find, documentAnalyzer.orphanNodes);

    return documentAnalyzer.analyzerTree.tree;
  } catch {
    return documentAnalyzer.analyzerTree.tree;
  }
}
