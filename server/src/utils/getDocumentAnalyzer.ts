import {
  DocumentsAnalyzerMap,
  DocumentAnalyzer as IDocumentAnalyzer,
} from "@common/types";
import { findProjectBasePathFor } from "@utils/findProjectBasePathFor";
import { WorkspaceFolder } from "vscode-languageserver-protocol";
import { DocumentAnalyzer } from "../parser/analyzer/DocumentAnalyzer";

/**
 * Get or create and get DocumentAnalyzer.
 *
 * @param uri The path to the file with the document.
 * Uri needs to be decoded and without the "file://" prefix.
 */

export function getDocumentAnalyzer(
  {
    workspaceFolders,
    solFileIndex,
  }: {
    workspaceFolders: WorkspaceFolder[];
    solFileIndex: DocumentsAnalyzerMap;
  },
  uri: string
): IDocumentAnalyzer {
  let documentAnalyzer = solFileIndex[uri];

  if (!documentAnalyzer) {
    const projectBasePath = findProjectBasePathFor({ workspaceFolders }, uri);

    if (!projectBasePath) {
      throw new Error(
        "Document analyzer can't be retrieved as project base path not set."
      );
    }

    documentAnalyzer = new DocumentAnalyzer(projectBasePath, uri);

    solFileIndex[uri] = documentAnalyzer;
  }

  return documentAnalyzer;
}
