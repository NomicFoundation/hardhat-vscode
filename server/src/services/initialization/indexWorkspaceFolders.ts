import { IndexFileData } from "@common/event";
import { Logger } from "@utils/Logger";
import { WorkspaceFolder } from "vscode-languageserver-protocol";
import { decodeUriAndRemoveFilePrefix } from "../../utils/index";
import { Connection } from "vscode-languageserver";
import { WorkspaceFileRetriever } from "@analyzer/WorkspaceFileRetriever";
import { DocumentAnalyzer } from "@analyzer/DocumentAnalyzer";
import { DocumentsAnalyzerMap } from "@common/types";
import { getDocumentAnalyzer } from "@utils/getDocumentAnalyzer";
import { analyzeSolFile } from "@analyzer/analyzeSolFile";

type IndexWorkspaceFoldersContext = {
  workspaceFolders: WorkspaceFolder[];
  connection: Connection;
  solFileIndex: DocumentsAnalyzerMap;
  logger: Logger;
};

export async function indexWorkspaceFolders(
  indexWorkspaceFoldersContext: IndexWorkspaceFoldersContext,
  workspaceFileRetriever: WorkspaceFileRetriever
) {
  const { workspaceFolders, logger } = indexWorkspaceFoldersContext;

  if (workspaceFolders.some((wf) => wf.uri.includes("\\"))) {
    throw new Error("Unexpect windows style path");
  }

  logger.info("Starting workspace indexing ...");
  logger.info("Scanning workspace for sol files");

  for (const workspaceFolder of workspaceFolders) {
    await scanForHardhatProjects(workspaceFolder, workspaceFileRetriever);

    await indexWorkspaceFolder(
      indexWorkspaceFoldersContext,
      workspaceFileRetriever,
      workspaceFolder
    );
  }

  logger.info("File indexing complete");
}

async function scanForHardhatProjects(
  workspaceFolder: WorkspaceFolder,
  workspaceFileRetriever: WorkspaceFileRetriever
) {
  const uri = decodeUriAndRemoveFilePrefix(workspaceFolder.uri);

  const hardhatConfigFiles = await workspaceFileRetriever.findFiles(
    uri,
    "**/hardhat.config.{ts,js}",
    ["**/node_modules/**"]
  );

  return hardhatConfigFiles;
}

async function indexWorkspaceFolder(
  {
    workspaceFolders,
    connection,
    solFileIndex,
    logger,
  }: IndexWorkspaceFoldersContext,
  workspaceFileRetriever: WorkspaceFileRetriever,
  workspaceFolder: WorkspaceFolder
) {
  try {
    const workspaceFolderPath = decodeUriAndRemoveFilePrefix(
      workspaceFolder.uri
    );

    const documentsUri: string[] = await workspaceFileRetriever.findFiles(
      workspaceFolderPath,
      "**/*.sol"
    );

    // this.workspaceFileRetriever.findSolFiles(
    //   BROWNIE_PACKAGE_PATH,
    //   documentsUri,
    //   this.logger
    // );
    logger.info(`Scan complete, ${documentsUri.length} sol files found`);

    // Init all documentAnalyzers
    for (const documentUri of documentsUri) {
      solFileIndex[documentUri] = new DocumentAnalyzer(
        workspaceFolderPath,
        documentUri
      );
    }

    logger.info("File indexing starting");

    if (documentsUri.length > 0) {
      // We will initialize all DocumentAnalizers first, because when we analyze documents we enter to their imports and
      // if they are not analyzed we analyze them, in order to be able to analyze imports we need to have DocumentAnalizer and
      // therefore we initiate everything first. The isAnalyzed serves to check if the document was analyzed so we don't analyze the document twice.
      for (let i = 0; i < documentsUri.length; i++) {
        const documentUri = documentsUri[i];

        try {
          const documentAnalyzer = getDocumentAnalyzer(
            { workspaceFolders, solFileIndex },
            documentUri
          );

          const data: IndexFileData = {
            path: documentUri,
            current: i + 1,
            total: documentsUri.length,
          };

          connection.sendNotification("custom/indexing-file", data);

          logger.trace("Indexing file", data);

          if (!documentAnalyzer.isAnalyzed) {
            analyzeSolFile(documentAnalyzer, solFileIndex);
          }
        } catch (err) {
          logger.error(err);
          logger.trace("Analysis of file failed", { documentUri });
        }
      }
    } else {
      const data: IndexFileData = {
        path: "",
        current: 0,
        total: 0,
      };

      connection.sendNotification("custom/indexing-file", data);
      logger.trace("No files to index", data);
    }
  } catch (err) {
    logger.error(err);
  }
}
