import { TextDocument } from "@common/types";
import { analyzeDocument } from "@utils/analyzeDocument";
import { getDocumentAnalyzer } from "@utils/getDocumentAnalyzer";
import { ServerState } from "../types";
import { LookupResult } from "./lookupEntryForUri";
import { getUriFromDocument } from "./index";

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

  analyzeDocument(serverState, newDocumentText, documentURI);

  const documentAnalyzer = getDocumentAnalyzer(serverState, documentURI);

  if (!documentAnalyzer.isAnalyzed()) {
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
