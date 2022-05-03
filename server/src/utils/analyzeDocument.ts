import { analyzeSolFile } from "@analyzer/analyzeSolFile";
import { Node, DocumentsAnalyzerMap, SolProjectMap } from "@common/types";
import { getDocumentAnalyzer } from "./getDocumentAnalyzer";

/**
 * @param uri The path to the file with the document.
 */
export function analyzeDocument(
  {
    projects,
    solFileIndex,
  }: {
    projects: SolProjectMap;
    solFileIndex: DocumentsAnalyzerMap;
  },
  document: string,
  uri: string
): Node | undefined {
  const documentAnalyzer = getDocumentAnalyzer(
    {
      projects,
      solFileIndex,
    },
    uri
  );

  return analyzeSolFile(documentAnalyzer, solFileIndex, document);
}
