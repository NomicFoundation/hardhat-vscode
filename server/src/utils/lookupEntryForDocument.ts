import { TextDocument } from "@common/types";
import { Analyzer } from "@analyzer/index";
import { getUriFromDocument } from "./index";

export function lookupEntryForDocument(
  analyzer: Analyzer,
  document: TextDocument
) {
  const documentURI = getUriFromDocument(document);
  const currentAnalyzer = analyzer.getDocumentAnalyzer(documentURI);

  return currentAnalyzer;
}
