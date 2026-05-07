import { WorkspaceFolder } from "vscode-languageserver-protocol";
import { WorkspaceFileRetriever } from "@utils/WorkspaceFileRetriever";
import _ from "lodash";
import path from "path";
import { startSpan } from "@sentry/core";
import { SolFileEntry } from "../../parser/SolFileEntry";
import { decodeUriAndRemoveFilePrefix, toUnixStyle } from "../../utils/index";
import { ServerState } from "../../types";
import { HardhatIndexer } from "../../frameworks/Hardhat/HardhatIndexer";
import { Project } from "../../frameworks/base/Project";
import { ProjectlessProject } from "../../frameworks/Projectless/ProjectlessProject";
import { Logger } from "../../utils/Logger";
import { normalizeAbsolutePath } from "../../utils/paths";
import { FoundryIndexer } from "../../frameworks/Foundry/FoundryIndexer";
import { frameworkTag } from "../../telemetry/tags";
import { TruffleIndexer } from "../../frameworks/Truffle/TruffleIndexer";
import { ApeIndexer } from "../../frameworks/Ape/ApeIndexer";
import { isTestMode } from "../../utils";
import {
  getCompilationForFile,
  resolvePragmaGroupsForProject,
} from "../../parser/compilation";
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
    new TruffleIndexer(serverState, workspaceFileRetriever),
    new ApeIndexer(serverState, workspaceFileRetriever),
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
    for (const foundProject of foundProjects) {
      if (foundProject.id() in serverState.projects) {
        return;
      }

      serverState.projects[foundProject.id()] = foundProject;
      logger.info(`Initializing ${foundProject.id()}`);
      try {
        await startSpan(
          { name: "initializeProject", attributes: frameworkTag(foundProject) },
          async () => foundProject.initialize()
        );
      } catch (error) {
        logger.error(error);
      }

      logger.info(`Done ${foundProject.id()}`);
    }
  });

  // Find all sol files
  let solFileUris: string[];
  await logger.trackTime("Indexing solidity files", async () => {
    await startSpan({ name: "findSolidityFiles" }, async () => {
      solFileUris = await scanForSolFiles(
        logger,
        workspaceFileRetriever,
        topLevelWorkspaceFolders
      );

      // Index sol files, and associate the matching project
      await indexSolidityFiles(serverState, solFileUris);
    });
  });

  // Store workspace folders to mark them as indexed
  for (const workspaceFolder of topLevelWorkspaceFolders) {
    serverState.indexedWorkspaceFolders.push(workspaceFolder);
  }

  // Pre-analyze local files to populate framework dependency graphs
  // (needed for import resolution in multi-file compilations)
  const localSolFileUris = solFileUris!.filter(
    (uri) => serverState.solFileIndex[uri]?.isLocal === true
  );

  await logger.trackTime("Pre-analyzing solidity files", async () => {
    for (const documentUri of localSolFileUris) {
      try {
        const solFileEntry = serverState.solFileIndex[documentUri];

        if (solFileEntry?.text !== undefined) {
          const absolutePath = normalizeAbsolutePath(documentUri);
          await solFileEntry.project.preAnalyze(absolutePath, solFileEntry.text);
        }
      } catch (err) {
        logger.error(err);
      }
    }
  });

  // Warm the Slang compilation cache so the user's first interaction with a
  // file doesn't pay the full project parse cost. Cache entries are keyed
  // by (project, resolved-solc-version), so warm one entry per distinct
  // pragma group in each project. Skipped in tests (per-test scopes).
  if (!isTestMode()) {
    await logger.trackTime("Warming compilation cache", async () => {
      const seenProjects = new Set<string>();
      for (const documentUri of localSolFileUris) {
        const solFileEntry = serverState.solFileIndex[documentUri];
        if (solFileEntry === undefined) continue;
        const projectBase = solFileEntry.project.basePath;
        if (seenProjects.has(projectBase)) continue;
        seenProjects.add(projectBase);

        const groupReps = await resolvePragmaGroupsForProject(
          serverState,
          projectBase
        );

        for (const representativeFileId of groupReps) {
          try {
            await getCompilationForFile(serverState, representativeFileId);
          } catch (err) {
            logger.trace(
              `warm-up failed for ${representativeFileId}: ${err}`
            );
          }
        }
      }
    });
  }
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
  for (const fileUri of fileUris) {
    await indexSolidityFile(serverState, fileUri);
  }
}

export async function indexSolidityFile(
  serverState: ServerState,
  fileUri: string
) {
  if (!(await serverState.workspaceFileRetriever.isFile(fileUri))) {
    return;
  }

  const { project, isLocal } = await findProjectForFile(serverState, fileUri);

  serverState.logger.trace(
    `Associating ${project.id()} to ${fileUri}. Local: ${isLocal}`
  );

  const docText = await serverState.workspaceFileRetriever.readFile(fileUri);

  const solFileEntry = SolFileEntry.createLoadedEntry(
    fileUri,
    project,
    docText,
    isLocal
  );

  serverState.solFileIndex[fileUri] = solFileEntry;

  return solFileEntry;
}

async function findProjectForFile(serverState: ServerState, fileUri: string) {
  let project: Project = new ProjectlessProject(
    serverState,
    path.dirname(fileUri)
  );
  let isLocal = false;

  for (const indexedProject of Object.values(serverState.projects)) {
    try {
      const result = await indexedProject.fileBelongs(fileUri);
      if (result.belongs && indexedProject.priority > project.priority) {
        project = indexedProject;
        isLocal = result.isLocal;
      }
    } catch (error) {
      serverState.logger.trace(`Error on fileBelongs: ${error}`);
      continue;
    }
  }

  return { project, isLocal };
}
