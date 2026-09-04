import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import {
  publishedPackages,
  tarballName,
  vsixPath,
  type Package,
} from "../utils/packages.ts";
import { repoArgs } from "../utils/github.ts";
import { capture, run, runTolerant } from "../utils/process.ts";

const TARBALLS = "tarballs";

/**
 * Puts the diffs into the run log before anyone approves the publish: what
 * each tarball changes against the version currently on npm, and what the vsix
 * changes against the one attached to the last release.
 */
export async function review(): Promise<void> {
  for (const pkg of publishedPackages()) {
    await diffPackage(pkg);
  }

  diffVsix();
}

async function diffPackage(pkg: Package): Promise<void> {
  const { name } = pkg;
  const url = latestTarballUrl(name);

  if (url === undefined) {
    console.log(
      `<< ${name} is not published yet, so there is nothing to diff >>`
    );

    return;
  }

  const normalised = normalise(name);
  const latest = path.join(TARBALLS, `${normalised}-latest.tgz`);
  await download(url, latest);

  const latestDir = path.join(TARBALLS, normalised, "latest");
  const proposedDir = path.join(TARBALLS, normalised, "proposed");
  mkdirSync(latestDir, { recursive: true });
  mkdirSync(proposedDir, { recursive: true });

  run("tar", ["-xzf", latest, "-C", latestDir]);
  run("tar", [
    "-xzf",
    path.join(TARBALLS, tarballName(pkg)),
    "-C",
    proposedDir,
  ]);

  console.log(`<< Showing files diff for ${name} >>`);
  showDiff(["--name-status", latestDir, proposedDir]);

  console.log(`<< Showing package.json diff for ${name} >>`);
  showDiff([
    path.join(latestDir, "package", "package.json"),
    path.join(proposedDir, "package", "package.json"),
  ]);
}

function latestTarballUrl(name: string): string | undefined {
  try {
    return capture("npm", ["view", `${name}@latest`, "dist.tarball"]);
  } catch (error) {
    if (error instanceof Error && /E404|404 Not Found/.test(error.message)) {
      return undefined;
    }

    throw error;
  }
}

function normalise(name: string): string {
  return name.replace("@", "").replace("/", "-");
}

async function download(url: string, destination: string): Promise<void> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`${url} responded ${response.status}`);
  }

  writeFileSync(destination, Buffer.from(await response.arrayBuffer()));
}

function showDiff(args: string[]): void {
  // `runTolerant` is used because `git diff --no-index` exits with 1 when differences
  // are found, and differences are expected.
  runTolerant("git", [
    "--no-pager",
    "diff",
    "--color=always",
    // `--no-index` is what lets us diff two directories that are not in a git repo.
    "--no-index",
    ...args,
  ]);
}

function diffVsix(): void {
  writeFileSync("proposed-vsix.txt", listing(vsixPath()));

  const { status } = spawnSync(
    "gh",
    [
      "release",
      "download",
      ...repoArgs(),
      "--pattern",
      "*.vsix",
      "--dir",
      "released-vsix",
    ],
    { stdio: "inherit" }
  );

  if (status !== 0) {
    console.log("No vsix on the latest release to compare against.");

    return;
  }

  writeFileSync("released-vsix.txt", listing(vsixPath("released-vsix")));

  console.log("<< Showing file listing diff for the vsix >>");
  showDiff(["released-vsix.txt", "proposed-vsix.txt"]);
}

// The bundles inside the vsix differ on every release, so the file listing is
// the part worth reading.
function listing(vsix: string): string {
  return `${capture("unzip", ["-Z1", vsix]).split("\n").sort().join("\n")}\n`;
}
