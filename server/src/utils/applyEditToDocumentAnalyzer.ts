import { TextDocument } from "@common/types";
import { getOrInitialiseSolFileEntry } from "@utils/getOrInitialiseSolFileEntry";
import { analyzeSolFile } from "@analyzer/analyzeSolFile";
import { ServerState } from "../types";
import { LookupResult } from "./lookupEntryForUri";
import { getUriFromDocument } from "./index";

export async function applyEditToDocumentAnalyzer(
  serverState: ServerState,
  uri: string,
  edit: (document: TextDocument) => string
): Promise<LookupResult> {
  const document = serverState.documents.get(uri);

  if (!document) {
    return {
      found: false,
      errorMessage: `No text document found for ${uri}`,
    };
  }

  const documentURI = getUriFromDocument(document);
  const newDocumentText = edit(document);

  const solFileEntry = getOrInitialiseSolFileEntry(serverState, documentURI);
  await analyzeSolFile(serverState, solFileEntry, newDocumentText);

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
