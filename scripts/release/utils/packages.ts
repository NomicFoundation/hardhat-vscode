import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

export const SUMMARY_FILE = "pnpm-publish-summary.json";

export interface Package {
  name: string;
  version: string;
}

/**
 * The packages `pnpm publish --dry-run --report-summary` decided need
 * publishing, i.e. the ones whose version is not on the registry yet.
 */
export function publishedPackages(directory: string = "."): Package[] {
  const summary: { publishedPackages?: Package[] } = JSON.parse(
    readFileSync(path.join(directory, SUMMARY_FILE), "utf8")
  );

  return (summary.publishedPackages ?? []).map(({ name, version }) => ({
    name,
    version,
  }));
}

/**
 * The name a tarball takes on disk: `pnpm pack` drops the scope's `@` and
 * turns its `/` into a dash.
 */
export function tarballName({ name, version }: Package): string {
  return `${name.replace("@", "").replace("/", "-")}-${version}.tgz`;
}

/** The version being released, which is the extension's. */
export function releaseVersion(): string {
  const { version } = JSON.parse(
    readFileSync("client/package.json", "utf8")
  ) as { version: string };

  return version;
}

/**
 * The vsix built by `pack`. In a release run it arrives as a downloaded
 * artifact in `vsix/`; run locally it is left in `client/` where vsce wrote it.
 */
export function vsixPath(...directories: string[]): string {
  const searched = directories.length > 0 ? directories : ["vsix", "client"];

  for (const directory of searched) {
    const found = readdirSafe(directory).filter((entry) =>
      entry.endsWith(".vsix")
    );

    if (found.length > 1) {
      throw new Error(
        `expected one vsix in ${directory}, found ${found.length}`
      );
    }

    if (found.length === 1) {
      return path.join(directory, found[0]);
    }
  }

  throw new Error(`no vsix found in ${searched.join(" or ")}`);
}

function readdirSafe(directory: string): string[] {
  try {
    return readdirSync(directory);
  } catch {
    return [];
  }
}
