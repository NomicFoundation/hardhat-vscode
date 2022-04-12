import * as path from "path";
import { IndexFileData } from "@common/event";
import { Logger } from "@utils/Logger";
import { WorkspaceFolder } from "vscode-languageserver-protocol";
import { decodeUriAndRemoveFilePrefix } from "../../utils/index";
import { Connection } from "vscode-languageserver";
import { WorkspaceFileRetriever } from "@analyzer/WorkspaceFileRetriever";
import { SolFileEntry } from "@analyzer/SolFileEntry";
import { DocumentsAnalyzerMap, SolProjectMap } from "@common/types";
import { getDocumentAnalyzer } from "@utils/getDocumentAnalyzer";
import { analyzeSolFile } from "@analyzer/analyzeSolFile";
import { HardhatProject } from "@analyzer/HardhatProject";
import { findProjectFor } from "@utils/findProjectFor";

type IndexWorkspaceFoldersContext = {
  connection: Connection;
  solFileIndex: DocumentsAnalyzerMap;
  projects: SolProjectMap;
  logger: Logger;
};

export async function indexWorkspaceFolders(
  indexWorkspaceFoldersContext: IndexWorkspaceFoldersContext,
  workspaceFileRetriever: WorkspaceFileRetriever,
  workspaceFolders: WorkspaceFolder[]
) {
  const { logger } = indexWorkspaceFoldersContext;

  if (workspaceFolders.some((wf) => wf.uri.includes("\\"))) {
    throw new Error("Unexpect windows style path");
  }

  logger.info("Starting workspace indexing ...");
  logger.info("Scanning workspace for sol files");

  // TODO: deal with nested workspaces
  for (const workspaceFolder of workspaceFolders) {
    await scanForHardhatProjectsAndAppend(
      workspaceFolder,
      indexWorkspaceFoldersContext.projects,
      workspaceFileRetriever
    );

    await indexWorkspaceFolder(
      indexWorkspaceFoldersContext,
      workspaceFileRetriever,
      workspaceFolder,
      indexWorkspaceFoldersContext.projects
    );
  }

  logger.info("File indexing complete");
}

async function scanForHardhatProjectsAndAppend(
  workspaceFolder: WorkspaceFolder,
  projects: SolProjectMap,
  workspaceFileRetriever: WorkspaceFileRetriever
): Promise<void> {
  const uri = decodeUriAndRemoveFilePrefix(workspaceFolder.uri);

  const hardhatConfigFiles = await workspaceFileRetriever.findFiles(
    uri,
    "**/hardhat.config.{ts,js}",
    ["**/node_modules/**"]
  );

  const foundProjects = hardhatConfigFiles.map(
    (hhcf) =>
      new HardhatProject(
        path.dirname(decodeUriAndRemoveFilePrefix(hhcf)),
        hhcf,
        workspaceFolder
      )
  );

  for (const project of foundProjects) {
    projects[project.basePath] = project;
  }
}

async function indexWorkspaceFolder(
  { connection, solFileIndex, logger }: IndexWorkspaceFoldersContext,
  workspaceFileRetriever: WorkspaceFileRetriever,
  workspaceFolder: WorkspaceFolder,
  projects: SolProjectMap
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
      try {
        const docText = await workspaceFileRetriever.readFile(documentUri);
        const project = findProjectFor({ projects }, documentUri);

        solFileIndex[documentUri] = SolFileEntry.createLoadedEntry(
          documentUri,
          project,
          docText.toString()
        );
      } catch (err) {
        logger.error(err);
      }
    }

    logger.info("File indexing starting");

    if (documentsUri.length > 0) {
      // We will initialize all DocumentAnalizers first, because when we analyze documents we enter to their imports and
      // if they are not analyzed we analyze them, in order to be able to analyze imports we need to have DocumentAnalizer and
      // therefore we initiate everything first. The isAnalyzed serves to check if the document was analyzed so we don't analyze the document twice.
      for (let i = 0; i < documentsUri.length; i++) {
        const documentUri = documentsUri[i];

        try {
          const solFileEntry = getDocumentAnalyzer(
            { projects, solFileIndex },
            documentUri
          );

          const data: IndexFileData = {
            path: documentUri,
            current: i + 1,
            total: documentsUri.length,
          };

          connection.sendNotification("custom/indexing-file", data);

          logger.trace("Indexing file", data);

          if (!solFileEntry.isAnalyzed()) {
            analyzeSolFile(solFileEntry, solFileIndex);
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
