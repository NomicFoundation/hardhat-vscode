import fs from "fs/promises";
import _ from "lodash";
import os from "os";
import path from "path";
import semver from "semver";
import { Logger } from "../../utils/Logger";

const CACHE_FILE_NAME = "solc-versions.json";

interface CacheFileContents {
  versions: string[];
}

/**
 * Compute the per-user cache directory for a given package, matching the
 * layout `env-paths` produces. Reimplemented here so the server doesn't take a
 * dependency on it, and so we can locate hardhat's cache without reaching into
 * its internals.
 */
function cacheDirFor(packageName: string): string {
  const home = os.homedir();

  if (process.platform === "win32") {
    const localAppData =
      process.env.LOCALAPPDATA ?? path.join(home, "AppData", "Local");

    return path.join(localAppData, packageName, "Cache");
  }

  if (process.platform === "darwin") {
    return path.join(home, "Library", "Caches", packageName);
  }

  return path.join(
    process.env.XDG_CACHE_HOME ?? path.join(home, ".cache"),
    packageName
  );
}

/**
 * Where to persist the versions we've seen. Prefers the storage directory the
 * editor reserved for the extension, falling back to a per-user cache dir for
 * clients that don't provide one.
 */
export function resolveStorageDir(globalStoragePath?: string): string {
  if (globalStoragePath !== undefined && globalStoragePath.trim() !== "") {
    return globalStoragePath;
  }

  return cacheDirFor("hardhat-vscode-nodejs");
}

export function onlyValidVersions(versions: unknown): string[] {
  if (!Array.isArray(versions)) {
    return [];
  }

  return versions.flatMap((version) => {
    if (typeof version !== "string") {
      return [];
    }

    const normalized = semver.valid(version);

    return normalized === null ? [] : [normalized];
  });
}

/**
 * Versions successfully fetched at some point in the past. solc releases are
 * append-only - a version is never unpublished - so this list can only ever be
 * incomplete, never wrong. That's what makes it safe to union without any
 * invalidation.
 */
export async function readRememberedVersions(
  storageDir: string,
  logger: Logger
): Promise<string[]> {
  const filePath = path.join(storageDir, CACHE_FILE_NAME);

  try {
    const raw = await fs.readFile(filePath, "utf8");
    const contents: CacheFileContents = JSON.parse(raw);

    return onlyValidVersions(contents.versions);
  } catch (error: unknown) {
    if ((error as NodeJS.ErrnoException)?.code !== "ENOENT") {
      logger.trace(`Could not read remembered solc versions: ${error}`);
    }

    return [];
  }
}

export async function rememberVersions(
  storageDir: string,
  versions: string[],
  logger: Logger
): Promise<void> {
  const filePath = path.join(storageDir, CACHE_FILE_NAME);

  const tempPath = `${filePath}.${process.pid}.tmp`;

  try {
    await fs.mkdir(storageDir, { recursive: true });

    const contents: CacheFileContents = {
      versions: _.uniq(versions).sort(semver.compare),
    };

    await fs.writeFile(tempPath, JSON.stringify(contents, null, 2), "utf8");
    await fs.rename(tempPath, filePath);
  } catch (error: unknown) {
    // Persisting is best-effort: a read-only or missing storage dir must not
    // break validation.
    logger.trace(`Could not persist solc versions: ${error}`);

    try {
      await fs.unlink(tempPath);
    } catch {
      // Nothing to clean up, or we can't - either way it doesn't matter.
    }
  }
}

const HARDHAT_COMPILER_DIRS = ["compilers-v2", "compilers-v3"];

/**
 * Anyone who has compiled once already has a compiler list on disk, and it's
 * usually far fresher than the list bundled with this extension. Free, offline,
 * and independent of whether our own cache has been written yet.
 *
 * Pre-release builds are excluded on purpose: they emit warnings that carry no
 * `sourceLocation`, and they should never be selected to satisfy a pragma.
 *
 * `cacheRoot` exists so tests can point at a fixture instead of the developer's
 * home directory.
 */
export async function readHardhatCompilerVersions(
  logger: Logger,
  cacheRoot: string = cacheDirFor("hardhat-nodejs")
): Promise<string[]> {
  const perGeneration = await Promise.all(
    HARDHAT_COMPILER_DIRS.map((dir) =>
      readCompilersDir(path.join(cacheRoot, dir), logger)
    )
  );

  return _.union(...perGeneration);
}

async function readCompilersDir(
  compilersDir: string,
  logger: Logger
): Promise<string[]> {
  try {
    const platformDirs = await fs.readdir(compilersDir);

    const perPlatform = await Promise.all(
      platformDirs.map((platformDir) =>
        readCompilerListVersions(path.join(compilersDir, platformDir), logger)
      )
    );

    return _.union(...perPlatform);
  } catch (error: unknown) {
    if ((error as NodeJS.ErrnoException)?.code !== "ENOENT") {
      logger.trace(`Could not read hardhat compiler lists: ${error}`);
    }

    return [];
  }
}

async function readCompilerListVersions(
  platformDir: string,
  logger: Logger
): Promise<string[]> {
  try {
    const raw = await fs.readFile(path.join(platformDir, "list.json"), "utf8");
    const list: { builds?: Array<{ version?: string; prerelease?: unknown }> } =
      JSON.parse(raw);

    // Truthiness rather than `!== undefined`: the field is absent on releases,
    // but null or "" would otherwise read as "not a pre-release".
    const released = (list.builds ?? [])
      .filter((build) => !build.prerelease)
      .map((build) => build.version);

    return onlyValidVersions(released);
  } catch (error: unknown) {
    if ((error as NodeJS.ErrnoException)?.code !== "ENOENT") {
      logger.trace(`Could not read compiler list in ${platformDir}: ${error}`);
    }

    return [];
  }
}
