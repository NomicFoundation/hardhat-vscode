import {
  DocumentsAnalyzerMap,
  DocumentAnalyzer as IDocumentAnalyzer,
} from "@common/types";
import { findProjectBasePathFor } from "@utils/findProjectBasePathFor";
import { Logger } from "@utils/Logger";
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
    logger,
  }: {
    workspaceFolders: WorkspaceFolder[];
    solFileIndex: DocumentsAnalyzerMap;
    logger: Logger;
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

    documentAnalyzer = new DocumentAnalyzer(projectBasePath, uri, logger);

    solFileIndex[uri] = documentAnalyzer;
  }

  return documentAnalyzer;
}
