import { getUriFromDocument } from "./index";
import { ServerState } from "../types";
import { DocumentAnalyzer } from "@common/types";
import { TextDocument } from "vscode-languageserver-textdocument";

export type LookupResult = {
  found: boolean;
  errorMessage?: string;
  documentAnalyzer?: DocumentAnalyzer;
  document?: TextDocument;
};

export function lookupEntryForUri(
  { documents, analyzer }: ServerState,
  uri: string
): LookupResult {
  const document = documents.get(uri);

  if (!document) {
    return {
      found: false,
      errorMessage: `No text document found for ${uri}`,
    };
  }

  const documentURI = getUriFromDocument(document);
  const documentAnalyzer = analyzer.getDocumentAnalyzer(documentURI);

  if (!documentAnalyzer.isAnalyzed) {
    return {
      found: false,
      errorMessage: `Text document not analyzed for ${uri}`,
    };
  }

  return {
    found: true,
    documentAnalyzer,
    document,
  };
}
