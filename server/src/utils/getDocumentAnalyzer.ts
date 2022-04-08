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

    // TODO: this is wrong, we shouldn't be doing arbitary sync file reads
    // put here to move it out of the constructor. Can we replace this with
    // a unloaded state?
    const docText = fs.existsSync(uri) ? fs.readFileSync(uri).toString() : "";
    documentAnalyzer = new SolFileEntry(projectBasePath, uri, docText);

    solFileIndex[uri] = documentAnalyzer;
  }

  return documentAnalyzer;
}
