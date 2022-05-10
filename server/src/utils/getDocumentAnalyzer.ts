import * as fs from "fs";
import {
  DocumentsAnalyzerMap,
  ISolFileEntry as IDocumentAnalyzer,
  SolProjectMap,
} from "@common/types";
import { findProjectFor } from "@utils/findProjectFor";
import { SolFileEntry } from "../parser/analyzer/SolFileEntry";

/**
 * Get or create and get DocumentAnalyzer.
 *
 * @param uri The path to the file with the document.
 * Uri needs to be decoded and without the "file://" prefix.
 */

export function getDocumentAnalyzer(
  {
    projects,
    solFileIndex,
  }: {
    projects: SolProjectMap;
    solFileIndex: DocumentsAnalyzerMap;
  },
  uri: string
): IDocumentAnalyzer {
  let documentAnalyzer = solFileIndex[uri];

  if (!documentAnalyzer) {
    const project = findProjectFor({ projects }, uri);

    if (fs.existsSync(uri)) {
      const docText = fs.readFileSync(uri).toString();
      documentAnalyzer = SolFileEntry.createLoadedEntry(uri, project, docText);
    } else {
      // TODO: figure out what happens if we just don't do this
      // why bother with non-existant files? Maybe untitled but unsaved
      // files?
      documentAnalyzer = SolFileEntry.createUnloadedEntry(uri, project);
    }

    solFileIndex[uri] = documentAnalyzer;
  }

  return documentAnalyzer;
}
