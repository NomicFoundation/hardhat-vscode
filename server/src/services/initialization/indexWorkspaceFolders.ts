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
  indexJobCount: number;
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

  indexWorkspaceFoldersContext.indexJobCount++;
  const indexJobId = indexWorkspaceFoldersContext.indexJobCount;

  const indexJobStartTime = new Date();
  logger.info(`[indexing:${indexJobId}] Starting indexing job ...`);

  const topLevelWorkspaceFolders = resolveTopLevelWorkspaceFolders(
    indexWorkspaceFoldersContext,
    workspaceFolders
  );

  if (topLevelWorkspaceFolders.length === 0) {
    logger.info(`[indexing:${indexJobId}] Workspace folders already indexed`);
    return;
  }

  notifyStartIndexing(indexJobId, indexWorkspaceFoldersContext);

  logger.info(`[indexing:${indexJobId}] Workspace folders`);
  for (const workspaceFolder of topLevelWorkspaceFolders) {
    logger.info(`[indexing:${indexJobId}]   ${workspaceFolder.name}`);
  }

  for (const workspaceFolder of topLevelWorkspaceFolders) {
    try {
      await scanForHardhatProjectsAndAppend(
        indexJobId,
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
    indexJobId,
    indexWorkspaceFoldersContext,
    workspaceFileRetriever,
    topLevelWorkspaceFolders
  );

  try {
    await analyzeSolFiles(
      indexJobId,
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

  logger.info(
    `[indexing:${indexJobId}] Indexing complete (${
      (new Date().getTime() - indexJobStartTime.getTime()) / 1000
    }s)`
  );
}

async function scanForHardhatProjectsAndAppend(
  indexJobId: number,
  workspaceFolder: WorkspaceFolder,
  projects: SolProjectMap,
  workspaceFileRetriever: WorkspaceFileRetriever,
  logger: Logger
): Promise<void> {
  const scanningStartTime = new Date();
  logger.info(
    `[indexing:${indexJobId}] Scanning ${workspaceFolder.name} for hardhat projects`
  );

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
    logger.info(
      `[indexing:${indexJobId}]   No hardhat projects found in ${workspaceFolder.name}`
    );
  } else {
    logger.info(
      `[indexing:${indexJobId}]   Hardhat projects found in ${
        workspaceFolder.name
      } (${(new Date().getTime() - scanningStartTime.getTime()) / 1000}s):`
    );

    for (const foundProject of foundProjects) {
      logger.info(`[indexing:${indexJobId}]     ${foundProject.basePath}`);
    }
  }
}

async function scanForSolFiles(
  indexJobId: number,
  { logger }: IndexWorkspaceFoldersContext,
  workspaceFileRetriever: WorkspaceFileRetriever,
  workspaceFolders: WorkspaceFolder[]
): Promise<string[]> {
  const solFileScanStart = new Date();
  logger.info(
    `[indexing:${indexJobId}] Scanning workspace folders for sol files`
  );

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

  logger.info(
    `[indexing:${indexJobId}]   Scan complete, ${
      solFileUris.length
    } sol files found (${
      (new Date().getTime() - solFileScanStart.getTime()) / 1000
    }s)`
  );

  return solFileUris;
}

async function analyzeSolFiles(
  indexJobId: number,
  indexWorkspaceFoldersContext: IndexWorkspaceFoldersContext,
  workspaceFileRetriever: WorkspaceFileRetriever,
  projects: SolProjectMap,
  solFileUris: string[]
) {
  const { connection, solFileIndex, logger } = indexWorkspaceFoldersContext;
  const analysisStart = new Date();

  try {
    logger.info(`[indexing:${indexJobId}] Analysing Sol files`);

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
            jobId: indexJobId,
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
      notifyNoOpIndexing(
        indexJobId,
        indexWorkspaceFoldersContext,
        "No files to index"
      );
    }
  } catch (err) {
    logger.error(err);
  } finally {
    logger.info(
      `[indexing:${indexJobId}]   Analysis complete (${
        (new Date().getTime() - analysisStart.getTime()) / 1000
      }s)`
    );
  }
}

function notifyNoOpIndexing(
  indexJobId: number,
  indexWorkspaceFoldersContext: IndexWorkspaceFoldersContext,
  logMessage: string
) {
  const data: IndexFileData = {
    jobId: indexJobId,
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

function notifyStartIndexing(
  indexJobId: number,
  indexWorkspaceFoldersContext: IndexWorkspaceFoldersContext
) {
  const data: IndexFileData = {
    jobId: indexJobId,
    path: "",
    current: 0,
    total: 0,
  };

  indexWorkspaceFoldersContext.connection.sendNotification(
    "custom/indexing-start",
    data
  );
}
