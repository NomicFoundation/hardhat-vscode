import fs from "fs";
import semver from "semver";
import type { CompilationUnit } from "@nomicfoundation/slang/compilation" with {
  "resolution-mode": "import",
};
import type { Cursor } from "@nomicfoundation/slang/cst" with {
  "resolution-mode": "import",
};
import { analyze } from "@nomicfoundation/solidity-analyzer";
import type { ServerState } from "../types";
import { decodeUriAndRemoveFilePrefix, toUri } from "../utils";
import { getOrInitialiseSolFileEntry } from "../utils/getOrInitialiseSolFileEntry";
import { getSlangUtils, resolveVersion } from "./slangHelpers";

interface CompilationEntry {
  unit: CompilationUnit;
  dirty: boolean;
}

// Cache keyed by `${projectBasePath}::${resolvedLanguageVersion}`. The
// languageVersion is derived from the *combined* pragmas of every file in
// the group, so files whose pragmas overlap (e.g. `^0.8.0` + `=0.8.20`)
// share one entry at the narrowed version; truly disjoint pragmas land in
// separate entries.
const projectCompilationCache = new Map<string, CompilationEntry>();

function cacheKey(projectBase: string, languageVersion: string): string {
  return `${projectBase}::${languageVersion}`;
}

let _allVersionsCache: string[] | undefined;
async function getAllVersions(): Promise<string[]> {
  if (_allVersionsCache === undefined) {
    const { LanguageFacts } = await getSlangUtils();
    _allVersionsCache = LanguageFacts.allVersions();
  }
  return _allVersionsCache;
}

interface PragmaGroup {
  languageVersion: string;
  additionalFiles: string[];
}

/**
 * Greedy combiner: starting from the primary file's pragma, fold in every
 * other local project file whose pragma keeps the combined constraint
 * satisfiable. Files that would break compatibility get skipped — they'll
 * form their own group when queried as a primary themselves.
 */
async function determinePragmaGroup(
  serverState: ServerState,
  primaryFileId: string
): Promise<PragmaGroup | undefined> {
  const primaryText = getFileText(serverState, primaryFileId);

  if (primaryText === undefined) {
    return undefined;
  }

  const primaryPragmas = analyze(primaryText).versionPragmas;
  const solFileEntry = serverState.solFileIndex[primaryFileId];
  const projectBase = solFileEntry?.project.basePath;

  if (projectBase === undefined) {
    const version = await resolveVersion(serverState.logger, primaryPragmas);
    return { languageVersion: version, additionalFiles: [] };
  }

  const allVersions = await getAllVersions();
  const combinedPragmas: string[] = [...primaryPragmas];
  const additionalFiles: string[] = [];

  const projectFileIds = Object.keys(serverState.solFileIndex)
    .filter((id) => id !== primaryFileId)
    .filter((id) => {
      const e = serverState.solFileIndex[id];
      return e?.project.basePath === projectBase && e.isLocal === true;
    })
    .sort();

  for (const id of projectFileIds) {
    const text = getFileText(serverState, id);

    if (text === undefined) {
      continue;
    }

    const filePragmas = analyze(text).versionPragmas;
    const tentative = [...combinedPragmas, ...filePragmas];

    if (semver.maxSatisfying(allVersions, tentative.join(" ")) === null) {
      continue;
    }

    combinedPragmas.push(...filePragmas);
    additionalFiles.push(id);
  }

  const languageVersion = await resolveVersion(
    serverState.logger,
    combinedPragmas
  );

  return { languageVersion, additionalFiles };
}

export async function getCompilationForFile(
  serverState: ServerState,
  uri: string
): Promise<CompilationUnit | undefined> {
  const internalUri = decodeUriAndRemoveFilePrefix(uri);
  const solFileEntry = getOrInitialiseSolFileEntry(serverState, internalUri);
  const projectKey = solFileEntry.project.basePath;

  const group = await determinePragmaGroup(serverState, internalUri);

  if (group === undefined) {
    return undefined;
  }

  const key = cacheKey(projectKey, group.languageVersion);
  const cached = projectCompilationCache.get(key);

  if (
    cached !== undefined &&
    !cached.dirty &&
    cached.unit.file(internalUri) !== undefined
  ) {
    return cached.unit;
  }

  return serverState.logger.trackTime(
    `compilation: build (${internalUri} @ ${group.languageVersion})`,
    async () => {
      const unit = await buildUnit(
        serverState,
        internalUri,
        group.additionalFiles,
        group.languageVersion
      );

      if (unit !== undefined) {
        projectCompilationCache.set(key, { unit, dirty: false });
      }

      return unit;
    }
  );
}

async function buildUnit(
  serverState: ServerState,
  primaryFileId: string,
  additionalFileIds: string[],
  languageVersion: string
): Promise<CompilationUnit | undefined> {
  const { CompilationBuilder } =
    await import("@nomicfoundation/slang/compilation");

  if (getFileText(serverState, primaryFileId) === undefined) {
    serverState.logger.trace(
      `compilation: could not read text for ${primaryFileId}`
    );
    return undefined;
  }

  const solFileEntry = serverState.solFileIndex[primaryFileId];
  const project = solFileEntry?.project;

  const builder = CompilationBuilder.create({
    languageVersion,
    readFile: async (id: string): Promise<string | undefined> =>
      getFileText(serverState, id),
    resolveImport: async (
      sourceFileId: string,
      importPath: Cursor
    ): Promise<string | undefined> => {
      if (project === undefined) {
        return undefined;
      }

      const importLiteral = importPath.node.unparse();
      const importString = importLiteral.slice(1, -1);

      try {
        const resolved = await project.resolveImportPath(
          sourceFileId,
          importString
        );
        return resolved ?? undefined;
      } catch {
        return undefined;
      }
    },
  });

  await builder.addFile(primaryFileId);

  for (const id of additionalFileIds) {
    try {
      await builder.addFile(id);
    } catch (err) {
      // Pre-filtering by pragma compatibility should prevent this; if it
      // still fires, log so we can see which file failed and why.
      serverState.logger.trace(
        `compilation: skipping ${id}: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
    }
  }

  return builder.build();
}

/**
 * Partition every local file in `projectBase` into pragma-compatible
 * groups (same greedy algorithm as `determinePragmaGroup`, but global
 * instead of primary-anchored) and return one representative file per
 * group. Used by the eager warm-up to avoid O(N²) per-file walks.
 */
export async function resolvePragmaGroupsForProject(
  serverState: ServerState,
  projectBase: string
): Promise<string[]> {
  const filesWithPragmas: Array<{ id: string; pragmas: string[] }> = [];

  for (const fileId of Object.keys(serverState.solFileIndex)) {
    const entry = serverState.solFileIndex[fileId];

    if (entry?.project.basePath !== projectBase || entry.isLocal !== true) {
      continue;
    }

    const text = getFileText(serverState, fileId);

    if (text === undefined) {
      continue;
    }

    filesWithPragmas.push({
      id: fileId,
      pragmas: analyze(text).versionPragmas,
    });
  }

  filesWithPragmas.sort((a, b) => a.id.localeCompare(b.id));

  const allVersions = await getAllVersions();
  const groups: Array<{ pragmas: string[]; representative: string }> = [];

  for (const { id, pragmas } of filesWithPragmas) {
    let assigned = false;

    for (const g of groups) {
      const tentative = [...g.pragmas, ...pragmas];

      if (semver.maxSatisfying(allVersions, tentative.join(" ")) !== null) {
        g.pragmas = tentative;
        assigned = true;
        break;
      }
    }

    if (!assigned) {
      groups.push({ pragmas: [...pragmas], representative: id });
    }
  }

  return groups.map((g) => g.representative);
}

function getFileText(
  serverState: ServerState,
  fileId: string
): string | undefined {
  const docUri = toUri(fileId);
  const openDoc = serverState.documents?.get(docUri);

  if (openDoc !== undefined) {
    return openDoc.getText();
  }

  const entry = serverState.solFileIndex[fileId];

  if (entry?.text !== undefined) {
    return entry.text;
  }

  try {
    if (fs.existsSync(fileId)) {
      return fs.readFileSync(fileId, "utf-8");
    }
  } catch {
    // Ignore filesystem errors
  }

  return undefined;
}

export function invalidateCompilation(
  serverState: ServerState,
  uri: string
): void {
  const internalUri = decodeUriAndRemoveFilePrefix(uri);
  const solFileEntry = serverState.solFileIndex[internalUri];

  if (solFileEntry === undefined) {
    return;
  }

  const prefix = `${solFileEntry.project.basePath}::`;

  // A file edit may have changed its pragma, so invalidate every pragma
  // group of the file's project — we can't know which group it now belongs
  // to without re-analyzing.
  for (const [key, entry] of projectCompilationCache) {
    if (key.startsWith(prefix)) {
      entry.dirty = true;
    }
  }
}

export function clearCompilationCache(): void {
  projectCompilationCache.clear();
}
