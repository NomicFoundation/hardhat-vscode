import { ISolFileEntry } from "@common/types";
import { TextDocument } from "vscode-languageserver-textdocument";
import { getOrInitialiseSolFileEntry } from "@utils/getOrInitialiseSolFileEntry";
import { ServerState } from "../types";
import { decodeUriAndRemoveFilePrefix } from "./index";

export interface LookupResult {
  found: boolean;
  errorMessage?: string;
  documentAnalyzer?: ISolFileEntry;
  document?: TextDocument;
}

export function lookupEntryForUri(
  serverState: ServerState,
  uri: string
): LookupResult {
  const document = serverState.documents.get(uri);

  if (!document) {
    return {
      found: false,
      errorMessage: `No text document found for ${uri}`,
    };
  }

  const internalUri = decodeUriAndRemoveFilePrefix(uri);
  const solFileEntry = getOrInitialiseSolFileEntry(serverState, internalUri);

  if (!solFileEntry.isAnalyzed()) {
    return {
      found: false,
      errorMessage: `Text document not analyzed for ${uri}`,
    };
  }

  return {
    found: true,
    documentAnalyzer: solFileEntry,
    document,
  };
}
