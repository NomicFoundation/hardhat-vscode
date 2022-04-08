import { WorkspaceFolder } from "vscode-languageserver-protocol";
import { DocumentsAnalyzerMap, TextDocument } from "@common/types";
import { getDocumentAnalyzer } from "@utils/getDocumentAnalyzer";
import { getUriFromDocument } from "./index";

export function lookupEntryForDocument(
  {
    workspaceFolders,
    solFileIndex,
  }: {
    workspaceFolders: WorkspaceFolder[];
    solFileIndex: DocumentsAnalyzerMap;
  },
  document: TextDocument
) {
  const documentURI = getUriFromDocument(document);
  const currentAnalyzer = getDocumentAnalyzer(
    {
      workspaceFolders,
      solFileIndex,
    },
    documentURI
  );

  return currentAnalyzer;
}
