import {
  DocumentsAnalyzerMap,
  SolProjectMap,
  TextDocument,
} from "@common/types";
import { getDocumentAnalyzer } from "@utils/getDocumentAnalyzer";
import { getUriFromDocument } from "./index";

export function lookupEntryForDocument(
  {
    projects,
    solFileIndex,
  }: {
    projects: SolProjectMap;
    solFileIndex: DocumentsAnalyzerMap;
  },
  document: TextDocument
) {
  const documentURI = getUriFromDocument(document);
  const currentAnalyzer = getDocumentAnalyzer(
    {
      projects,
      solFileIndex,
    },
    documentURI
  );

  return currentAnalyzer;
}
