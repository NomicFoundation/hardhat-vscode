import * as path from "path";
import { IndexFileData } from "@common/event";
import { Logger } from "@utils/Logger";
import { WorkspaceFolder } from "vscode-languageserver-protocol";
import { Connection } from "vscode-languageserver";
import { WorkspaceFileRetriever } from "@analyzer/WorkspaceFileRetriever";
import { SolFileEntry } from "@analyzer/SolFileEntry";
import {
  ISolProject,
  Remapping,
  SolFileIndexMap,
  SolProjectMap,
} from "@common/types";
import { getOrInitialiseSolFileEntry } from "@utils/getOrInitialiseSolFileEntry";
import { analyzeSolFile } from "@analyzer/analyzeSolFile";
import { HardhatProject } from "@analyzer/HardhatProject";
import { findProjectFor } from "@utils/findProjectFor";
import { decodeUriAndRemoveFilePrefix, toUnixStyle } from "../../utils/index";
import { FoundryProject } from "../../parser/analyzer/FoundryProject";
import { resolveTopLevelWorkspaceFolders } from "./resolveTopLevelWorkspaceFolders";

export interface IndexWorkspaceFoldersContext {
  indexJobCount: number;
  connection: Connection;
  solFileIndex: SolFileIndexMap;
  workspaceFolders: WorkspaceFolder[];
  projects: SolProjectMap;
  logger: Logger;
}

export async function indexWorkspaceFolders(
  context: IndexWorkspaceFoldersContext,
  workspaceFileRetriever: WorkspaceFileRetriever,
  workspaceFolders: WorkspaceFolder[]
) {
  const { logger } = context;

  if (workspaceFolders.some((wf) => wf.uri.includes("\\"))) {
    throw new Error("Unexpect windows style path");
  }

  context.indexJobCount++;
  const indexJobId = context.indexJobCount;

  const indexJobStartTime = new Date();
  logger.info(`[indexing:${indexJobId}] Starting indexing job ...`);

  notifyStartIndexing(indexJobId, context);

  const topLevelWorkspaceFolders = resolveTopLevelWorkspaceFolders(
    context,
    workspaceFolders
  );

  if (topLevelWorkspaceFolders.length === 0) {
    notifyNoOpIndexing(
      indexJobId,
      context,
      `[indexing:${indexJobId}] Workspace folders already indexed`
    );

    return;
  }

  logger.info(`[indexing:${indexJobId}] Workspace folders`);

  for (const workspaceFolder of topLevelWorkspaceFolders) {
    logger.info(`[indexing:${indexJobId}]   ${workspaceFolder.name}`);

    const hardhatConfigFiles = await findHardhatConfigFiles(
      workspaceFolder,
      workspaceFileRetriever
    );

    const foundryConfigFiles = await findFoundryConfigFiles(
      workspaceFolder,
      workspaceFileRetriever
    );

    const hardhatProjects = await Promise.all(
      hardhatConfigFiles.map((configFile) =>
        buildProject<HardhatProject>(
          HardhatProject,
          configFile,
          workspaceFolder,
          workspaceFileRetriever
        )
      )
    );

    const foundryProjects = await Promise.all(
      foundryConfigFiles.map((configFile) =>
        buildProject<FoundryProject>(
          FoundryProject,
          configFile,
          workspaceFolder,
          workspaceFileRetriever
        )
      )
    );

    for (const project of [...hardhatProjects, ...foundryProjects]) {
      if (project.basePath in context.projects) {
        logger.info(
          `[indexing:${indexJobId}]     Skipping ${project.basePath} (${project.type}) as it's already registered`
        );
      } else {
        logger.info(
          `[indexing:${indexJobId}]     Registering ${project.basePath} as a ${project.type} project`
        );
        context.projects[project.basePath] = project;
      }
    }
  }

  const solFiles = await scanForSolFiles(
    indexJobId,
    context,
    workspaceFileRetriever,
    topLevelWorkspaceFolders
  );

  try {
    await analyzeSolFiles(
      indexJobId,
      context,
      workspaceFileRetriever,
      context.projects,
      solFiles
    );
  } catch (err) {
    logger.error(err);
  }

  for (const workspaceFolder of topLevelWorkspaceFolders) {
    context.workspaceFolders.push(workspaceFolder);
  }

  logger.info(
    `[indexing:${indexJobId}] Indexing complete (${
      (new Date().getTime() - indexJobStartTime.getTime()) / 1000
    }s)`
  );
}

async function loadAndParseRemappings(
  basePath: string,
  workspaceFileRetriever: WorkspaceFileRetriever
): Promise<Remapping[]> {
  const remappingsPath = path.join(basePath, "remappings.txt");
  if (await workspaceFileRetriever.fileExists(remappingsPath)) {
    const rawRemappings = await workspaceFileRetriever.readFile(remappingsPath);
    return parseRemappings(rawRemappings, basePath);
  }

  return [];
}

function parseRemappings(rawRemappings: string, basePath: string) {
  const lines = rawRemappings.trim().split("\n");
  const remappings: Remapping[] = [];

  for (const line of lines) {
    const lineTokens = line.split("=", 2);

    if (
      lineTokens.length !== 2 ||
      lineTokens[0].length === 0 ||
      lineTokens[1].length === 0
    ) {
      continue;
    }

    const [from, to] = lineTokens;

    remappings.push({ from, to: path.join(basePath, to) });
  }

  return remappings;
}

async function findFoundryConfigFiles(
  workspaceFolder: WorkspaceFolder,
  workspaceFileRetriever: WorkspaceFileRetriever
) {
  const uri = decodeUriAndRemoveFilePrefix(workspaceFolder.uri);
  return workspaceFileRetriever.findFiles(uri, "**/foundry.toml", [
    "**/lib/**",
  ]);
}

async function findHardhatConfigFiles(
  workspaceFolder: WorkspaceFolder,
  workspaceFileRetriever: WorkspaceFileRetriever
) {
  const uri = decodeUriAndRemoveFilePrefix(workspaceFolder.uri);
  return workspaceFileRetriever.findFiles(uri, "**/hardhat.config.{ts,js}", [
    "**/node_modules/**",
  ]);
}

async function buildProject<T extends ISolProject>(
  klass: new (
    basePath: string,
    configFile: string,
    workspaceFolder: WorkspaceFolder,
    parsedRemappings: Remapping[]
  ) => T,
  configFile: string,
  workspaceFolder: WorkspaceFolder,
  workspaceFileRetriever: WorkspaceFileRetriever
): Promise<T> {
  const basePath = path.dirname(decodeUriAndRemoveFilePrefix(configFile));
  const parsedRemappings = await loadAndParseRemappings(
    basePath,
    workspaceFileRetriever
  );

  return new klass(basePath, configFile, workspaceFolder, parsedRemappings);
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
    try {
      const workspaceFolderPath = decodeUriAndRemoveFilePrefix(
        workspaceFolder.uri
      );

      const documentsUri: string[] = await workspaceFileRetriever.findFiles(
        workspaceFolderPath,
        "**/*.sol"
      );

      batches.push(documentsUri.map(toUnixStyle));
    } catch (err) {
      logger.error(err);
    }
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

        solFileIndex[solFileUri] = SolFileEntry.createLoadedUntrackedEntry(
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
          const data: IndexFileData = {
            jobId: indexJobId,
            path: documentUri,
            current: i + 1,
            total: solFileUris.length,
          };

          connection.sendNotification("custom/indexing-file", data);

          logger.trace(`Indexing file ${i}/${solFileUris.length}`, data);

          const solFileEntry = getOrInitialiseSolFileEntry(
            { projects, solFileIndex },
            documentUri
          );

          if (!solFileEntry.isAnalyzed()) {
            analyzeSolFile({ solFileIndex }, solFileEntry);
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
