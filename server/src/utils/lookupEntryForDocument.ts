import { WorkspaceFolder } from "vscode-languageserver-protocol";
import { DocumentsAnalyzerMap, TextDocument } from "@common/types";
import { getDocumentAnalyzer } from "@utils/getDocumentAnalyzer";
import { getUriFromDocument } from "./index";
import { Logger } from "./Logger";

export function lookupEntryForDocument(
  {
    workspaceFolders,
    solFileIndex,
    logger,
  }: {
    workspaceFolders: WorkspaceFolder[];
    solFileIndex: DocumentsAnalyzerMap;
    logger: Logger;
  },
  document: TextDocument
) {
  const documentURI = getUriFromDocument(document);
  const currentAnalyzer = getDocumentAnalyzer(
    {
      workspaceFolders,
      solFileIndex,
      logger,
    },
    documentURI
  );

  return currentAnalyzer;
}
