import { getUriFromDocument } from "./index";
import { ServerState } from "../types";
import { LookupResult } from "./lookupEntryForUri";
import { TextDocument } from "@common/types";

export function applyEditToDocumentAnalyzer(
  serverState: ServerState,
  uri: string,
  edit: (document: TextDocument) => string
): LookupResult {
  const document = serverState.documents.get(uri);

  if (!document) {
    return {
      found: false,
      errorMessage: `No text document found for ${uri}`,
    };
  }

  const documentURI = getUriFromDocument(document);

  const newDocumentText = edit(document);

  serverState.analyzer.analyzeDocument(newDocumentText, documentURI);

  const documentAnalyzer =
    serverState.analyzer.getDocumentAnalyzer(documentURI);

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
