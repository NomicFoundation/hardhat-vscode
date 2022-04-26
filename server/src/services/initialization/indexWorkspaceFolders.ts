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
import { resolveTopLevelWorkspaceFolders } from "./resolveTopLevelWorkspaceFolders";

export type IndexWorkspaceFoldersContext = {
  connection: Connection;
  solFileIndex: DocumentsAnalyzerMap;
  workspaceFolders: WorkspaceFolder[];
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

  const topLevelWorkspaceFolders = resolveTopLevelWorkspaceFolders(
    indexWorkspaceFoldersContext,
    workspaceFolders
  );

  if (topLevelWorkspaceFolders.length === 0) {
    notifyNoOpIndexing(
      indexWorkspaceFoldersContext,
      "No further workspace folders to index"
    );

    return;
  }

  logger.info("Starting indexing ...");

  for (const workspaceFolder of topLevelWorkspaceFolders) {
    try {
      await scanForHardhatProjectsAndAppend(
        workspaceFolder,
        indexWorkspaceFoldersContext.projects,
        workspaceFileRetriever,
        logger
      );
    } catch (err) {
      logger.error(err);
    }
  }

  const solFiles = await scanForSolFiles(
    indexWorkspaceFoldersContext,
    workspaceFileRetriever,
    topLevelWorkspaceFolders
  );

  try {
    await analyzeSolFiles(
      indexWorkspaceFoldersContext,
      workspaceFileRetriever,
      indexWorkspaceFoldersContext.projects,
      solFiles
    );
  } catch (err) {
    logger.error(err);
  }

  for (const workspaceFolder of topLevelWorkspaceFolders) {
    indexWorkspaceFoldersContext.workspaceFolders.push(workspaceFolder);
  }

  logger.info("File indexing complete");
}

async function scanForHardhatProjectsAndAppend(
  workspaceFolder: WorkspaceFolder,
  projects: SolProjectMap,
  workspaceFileRetriever: WorkspaceFileRetriever,
  logger: Logger
): Promise<void> {
  logger.info(`Scanning ${workspaceFolder.name} for hardhat projects`);

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
    if (project.basePath in project) {
      continue;
    }

    projects[project.basePath] = project;
  }

  if (foundProjects.length === 0) {
    logger.info(`  No hardhat projects found in ${workspaceFolder.name}`);
  } else {
    logger.info(`  Hardhat projects found in ${workspaceFolder.name}:`);
    for (const foundProject of foundProjects) {
      logger.info(`    ${foundProject.basePath}`);
    }
  }
}

async function scanForSolFiles(
  { logger }: IndexWorkspaceFoldersContext,
  workspaceFileRetriever: WorkspaceFileRetriever,
  workspaceFolders: WorkspaceFolder[]
): Promise<string[]> {
  logger.info(`Scanning workspace folders for sol files`);

  const batches: string[][] = [];

  for (const workspaceFolder of workspaceFolders) {
    const workspaceFolderPath = decodeUriAndRemoveFilePrefix(
      workspaceFolder.uri
    );

    const documentsUri: string[] = await workspaceFileRetriever.findFiles(
      workspaceFolderPath,
      "**/*.sol"
    );

    batches.push(documentsUri);
  }

  const solFileUris = batches.reduce((acc, batch) => acc.concat(batch), []);

  logger.info(`Scan complete, ${solFileUris.length} sol files found`);

  return solFileUris;
}

async function analyzeSolFiles(
  indexWorkspaceFoldersContext: IndexWorkspaceFoldersContext,
  workspaceFileRetriever: WorkspaceFileRetriever,
  projects: SolProjectMap,
  solFileUris: string[]
) {
  const { connection, solFileIndex, logger } = indexWorkspaceFoldersContext;

  try {
    // Init all documentAnalyzers
    for (const solFileUri of solFileUris) {
      try {
        const docText = await workspaceFileRetriever.readFile(solFileUri);
        const project = findProjectFor({ projects }, solFileUri);

        solFileIndex[solFileUri] = SolFileEntry.createLoadedEntry(
          solFileUri,
          project,
          docText.toString()
        );
      } catch (err) {
        logger.error(err);
      }
    }

    logger.info("File analysis starting");

    if (solFileUris.length > 0) {
      // We will initialize all DocumentAnalizers first, because when we analyze documents we enter to their imports and
      // if they are not analyzed we analyze them, in order to be able to analyze imports we need to have DocumentAnalizer and
      // therefore we initiate everything first. The isAnalyzed serves to check if the document was analyzed so we don't analyze the document twice.
      for (let i = 0; i < solFileUris.length; i++) {
        const documentUri = solFileUris[i];

        try {
          const solFileEntry = getDocumentAnalyzer(
            { projects, solFileIndex },
            documentUri
          );

          const data: IndexFileData = {
            path: documentUri,
            current: i + 1,
            total: solFileUris.length,
          };

          connection.sendNotification("custom/indexing-file", data);

          logger.trace(`Indexing file ${i}/${solFileUris.length}`, data);

          if (!solFileEntry.isAnalyzed()) {
            analyzeSolFile(solFileEntry, solFileIndex);
          }
        } catch (err) {
          logger.error(err);
          logger.trace("Analysis of file failed", { documentUri });
        }
      }
    } else {
      notifyNoOpIndexing(indexWorkspaceFoldersContext, "No files to index");
    }
  } catch (err) {
    logger.error(err);
  }
}

function notifyNoOpIndexing(
  indexWorkspaceFoldersContext: IndexWorkspaceFoldersContext,
  logMessage: string
) {
  const data: IndexFileData = {
    path: "",
    current: 0,
    total: 0,
  };

  indexWorkspaceFoldersContext.connection.sendNotification(
    "custom/indexing-file",
    data
  );

  indexWorkspaceFoldersContext.logger.trace(logMessage, data);
}
