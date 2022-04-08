import * as fs from "fs";
import {
  DocumentsAnalyzerMap,
  ISolFileEntry as IDocumentAnalyzer,
} from "@common/types";
import { findProjectBasePathFor } from "@utils/findProjectBasePathFor";
import { WorkspaceFolder } from "vscode-languageserver-protocol";
import { SolFileEntry } from "../parser/analyzer/SolFileEntry";

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

    if (fs.existsSync(uri)) {
      const docText = fs.readFileSync(uri).toString();
      documentAnalyzer = SolFileEntry.createLoadedEntry(
        uri,
        projectBasePath,
        docText
      );
    } else {
      // TODO: figure out what happens if we just don't do this
      // why bother with non-existant files? Maybe untitled but unsaved
      // files?
      documentAnalyzer = SolFileEntry.createUnloadedEntry(uri, projectBasePath);
    }

    solFileIndex[uri] = documentAnalyzer;
  }

  return documentAnalyzer;
}
