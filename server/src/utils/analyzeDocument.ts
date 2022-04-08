import { analyzeSolFile } from "@analyzer/analyzeSolFile";
import { Node, DocumentsAnalyzerMap } from "@common/types";
import { WorkspaceFolder } from "vscode-languageserver-protocol";
import { getDocumentAnalyzer } from "./getDocumentAnalyzer";

/**
 * @param uri The path to the file with the document.
 */
export function analyzeDocument(
  {
    workspaceFolders,
    solFileIndex,
  }: {
    workspaceFolders: WorkspaceFolder[];
    solFileIndex: DocumentsAnalyzerMap;
  },
  document: string,
  uri: string
): Node | undefined {
  const documentAnalyzer = getDocumentAnalyzer(
    {
      workspaceFolders,
      solFileIndex,
    },
    uri
  );

  return analyzeSolFile(documentAnalyzer, solFileIndex, document);
}
