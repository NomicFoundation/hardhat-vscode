import { Node, DocumentsAnalyzerMap } from "@common/types";
import { Logger } from "@utils/Logger";
import { WorkspaceFolder } from "vscode-languageserver-protocol";
import { getDocumentAnalyzer } from "./getDocumentAnalyzer";

/**
 * @param uri The path to the file with the document.
 */
export function analyzeDocument(
  {
    workspaceFolders,
    solFileIndex,
    logger,
  }: {
    workspaceFolders: WorkspaceFolder[];
    solFileIndex: DocumentsAnalyzerMap;
    logger: Logger;
  },
  document: string,
  uri: string
): Node | undefined {
  const documentAnalyzer = getDocumentAnalyzer(
    {
      workspaceFolders,
      solFileIndex,
      logger,
    },
    uri
  );

  return documentAnalyzer.analyze(solFileIndex, document);
}
