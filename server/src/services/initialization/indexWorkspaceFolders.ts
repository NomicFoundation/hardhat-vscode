import { WorkspaceFolder } from "vscode-languageserver-protocol";
import { WorkspaceFileRetriever } from "@utils/WorkspaceFileRetriever";
import { SolFileEntry } from "@analyzer/SolFileEntry";
import _ from "lodash";
import path from "path";
import { decodeUriAndRemoveFilePrefix, toUnixStyle } from "../../utils/index";
import { ServerState } from "../../types";
import { HardhatIndexer } from "../../frameworks/Hardhat/HardhatIndexer";
import { Project } from "../../frameworks/base/Project";
import { ProjectlessProject } from "../../frameworks/Projectless/ProjectlessProject";
import { Logger } from "../../utils/Logger";
import { analyzeSolFile } from "../../parser/analyzer/analyzeSolFile";
import { getOrInitialiseSolFileEntry } from "../../utils/getOrInitialiseSolFileEntry";
import { FoundryIndexer } from "../../frameworks/Foundry/FoundryIndexer";
import { resolveTopLevelWorkspaceFolders } from "./resolveTopLevelWorkspaceFolders";

export async function indexWorkspaceFolders(
  serverState: ServerState,
  workspaceFileRetriever: WorkspaceFileRetriever,
  workspaceFolders: WorkspaceFolder[]
) {
  const logger = _.clone(serverState.logger);
  logger.tag = "indexing";

  const topLevelWorkspaceFolders = resolveTopLevelWorkspaceFolders(
    serverState,
    workspaceFolders
  );

  // workspace change events are received duplicated, so return early if there's nothing new to index
  if (topLevelWorkspaceFolders.length === 0) {
    return;
  }

  // Store workspace folders to mark them as indexed
  serverState.indexedWorkspaceFolders.push(...topLevelWorkspaceFolders);

  if (topLevelWorkspaceFolders.length === 0) {
    return;
  }

  // Scan for projects
  const indexers = [
    new HardhatIndexer(serverState, workspaceFileRetriever),
    new FoundryIndexer(serverState, workspaceFileRetriever),
  ];
  const foundProjects: Project[] = [];
  await logger.trackTime("Indexing projects", async () => {
    for (const indexer of indexers) {
      for (const wsFolder of topLevelWorkspaceFolders) {
        foundProjects.push(...(await indexer.index(wsFolder)));
      }
    }
  });

  logger.info(`Found projects:`);
  for (const project of foundProjects) {
    logger.info(`-  Type: ${project.frameworkName()}`);
    logger.info(`   Base path: ${project.basePath}`);
    logger.info(`   Config file: ${project.configPath}`);
  }

  // Append to global project map if they are not already indexed
  await logger.trackTime("Initializing projects", async () => {
    await Promise.all(
      foundProjects.map(async (foundProject) => {
        if (foundProject.id() in serverState.projects) {
          return;
        }

        serverState.projects[foundProject.id()] = foundProject;
        logger.info(`Initializing ${foundProject.id()}`);
        await foundProject.initialize();
        logger.info(`Done ${foundProject.id()}`);
      })
    );
  });

  // Find all sol files
  let solFileUris: string[];
  await logger.trackTime("Indexing solidity files", async () => {
    solFileUris = await scanForSolFiles(
      logger,
      workspaceFileRetriever,
      topLevelWorkspaceFolders
    );

    // Index sol files, and associate the matching project
    await indexSolidityFiles(serverState, solFileUris);
  });

  // Store workspace folders to mark them as indexed
  for (const workspaceFolder of topLevelWorkspaceFolders) {
    serverState.indexedWorkspaceFolders.push(workspaceFolder);
  }

  // Analyze files
  await logger.trackTime("Analyzing solidity files", async () => {
    await analyzeSolFiles(serverState, logger, solFileUris);
  });
}

async function scanForSolFiles(
  logger: Logger,
  workspaceFileRetriever: WorkspaceFileRetriever,
  workspaceFolders: WorkspaceFolder[]
): Promise<string[]> {
  logger.info(`Scanning workspace folders for sol files`);

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

  logger.info(`Scan complete, ${solFileUris.length} sol files found`);

  return solFileUris;
}

export async function indexSolidityFiles(
  serverState: ServerState,
  fileUris: string[]
) {
  const indexedProjects = Object.values(serverState.projects);

  for (const fileUri of fileUris) {
    if (!(await serverState.workspaceFileRetriever.isFile(fileUri))) {
      continue;
    }

    let project: Project = new ProjectlessProject(
      serverState,
      path.dirname(fileUri)
    );

    for (const indexedProject of indexedProjects) {
      try {
        const belongs = await indexedProject.fileBelongs(fileUri);
        if (belongs && indexedProject.priority > project.priority) {
          project = indexedProject;
        }
      } catch (error) {
        serverState.logger.trace(`Error on fileBelongs: ${error}`);
        continue;
      }
    }

    serverState.logger.trace(`Associating ${project.id()} to ${fileUri}`);

    const docText = await serverState.workspaceFileRetriever.readFile(fileUri);
    serverState.solFileIndex[fileUri] = SolFileEntry.createLoadedEntry(
      fileUri,
      project,
      docText
    );
  }
}

async function analyzeSolFiles(
  serverState: ServerState,
  logger: Logger,
  solFileUris: string[]
) {
  const { solFileIndex } = serverState;

  try {
    // We will initialize all DocumentAnalizers first, because when we analyze documents we enter to their imports and
    // if they are not analyzed we analyze them, in order to be able to analyze imports we need to have DocumentAnalizer and
    // therefore we initiate everything first. The isAnalyzed serves to check if the document was analyzed so we don't analyze the document twice.
    for (let i = 0; i < solFileUris.length; i++) {
      const documentUri = solFileUris[i];

      try {
        logger.trace(`Analyzing file ${i}/${solFileUris.length}`);

        const solFileEntry = getOrInitialiseSolFileEntry(
          serverState,
          documentUri
        );

        if (!solFileEntry.isAnalyzed()) {
          await analyzeSolFile({ solFileIndex }, solFileEntry);
        }
      } catch (err) {
        logger.error(err);
        logger.trace("Analysis of file failed", { documentUri });
      }
    }
  } catch (err) {
    logger.error(err);
  }
}
