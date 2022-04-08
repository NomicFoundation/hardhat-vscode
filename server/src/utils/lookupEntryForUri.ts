import { getUriFromDocument } from "./index";
import { ServerState } from "../types";
import { ISolFileEntry } from "@common/types";
import { TextDocument } from "vscode-languageserver-textdocument";
import { getDocumentAnalyzer } from "@utils/getDocumentAnalyzer";

export type LookupResult = {
  found: boolean;
  errorMessage?: string;
  documentAnalyzer?: ISolFileEntry;
  document?: TextDocument;
};

export function lookupEntryForUri(
  serverState: ServerState,
  uri: string
): LookupResult {
  const { documents } = serverState;

  const document = documents.get(uri);

  if (!document) {
    return {
      found: false,
      errorMessage: `No text document found for ${uri}`,
    };
  }

  const documentURI = getUriFromDocument(document);
  const documentAnalyzer = getDocumentAnalyzer(serverState, documentURI);

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
