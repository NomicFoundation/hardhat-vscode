import { readFileSync, writeFileSync } from "node:fs";
import { releaseVersion, vsixPath } from "../utils/packages.ts";
import { repoArgs } from "../utils/github.ts";
import { run, prefixDryRun } from "../utils/process.ts";

/**
 * Tags the release and creates it on GitHub, carrying the same vsix that went
 * to the two marketplaces. The body is the version's own changelog section.
 */
export function tag({ dryRun }: { dryRun: boolean }): void {
  const version = process.env.VERSION ?? releaseVersion();
  const name = `v${version}`;
  const vsix = vsixPath();

  writeFileSync(
    "release-notes.md",
    releaseBody(readFileSync("client/CHANGELOG.md", "utf8"), version)
  );

  // Git tags are a side effect that outlives the run, and a release created on
  // GitHub is public, so a dry run does neither and says what it skipped.
  if (dryRun) {
    prefixDryRun("tag the npm packages from the changesets", [
      "pnpm",
      "changeset",
      "tag",
    ]);

    prefixDryRun(`tag this commit ${name} and push it`, [
      "git",
      "tag",
      "-a",
      name,
      "-m",
      name,
    ]);

    prefixDryRun(
      `create the GitHub release ${name}, with ${vsix} attached and release-notes.md as its body`,
      ["gh", "release", "create", name, "--title", name, vsix]
    );

    console.log("");
    console.log(`  [dry run] the release notes it would have used:\n`);
    console.log(readFileSync("release-notes.md", "utf8"));

    return;
  }

  run("pnpm", ["changeset", "tag"]);

  // The extension is private, so `changeset tag` produces nothing for it.
  run("git", ["tag", "-a", name, "-m", name]);
  run("git", ["push", "--follow-tags"]);

  run("gh", [
    "release",
    "create",
    name,
    ...repoArgs(),
    "--title",
    name,
    "--notes-file",
    "release-notes.md",
    vsix,
  ]);
}

/**
 * The footer every past release carries, below the changelog section. Kept
 * byte for byte so the automated releases read like the hand-written ones.
 */
export const HIRING_FOOTER = [
  "---",
  "> 💡 **The Nomic Foundation is hiring! Check [our open positions](https://www.nomic.foundation/jobs).**",
  "---",
].join("\n");

/** The body of the GitHub release: the version's changelog, then the footer. */
export function releaseBody(changelog: string, version: string): string {
  return `${releaseNotes(changelog, version)}\n${HIRING_FOOTER}\n`;
}

/**
 * The entries under `## <version>` in a changelog, without the heading.
 *
 * Changesets writes the heading as the bare version; the entries written by
 * hand before it took over carry a date after it.
 *
 * Exported for its tests; `tag` is the entry point.
 */
export function releaseNotes(changelog: string, version: string): string {
  const lines = changelog.split("\n");
  const start = lines.findIndex((line) => {
    const heading = line.trim();

    return heading === `## ${version}` || heading.startsWith(`## ${version} `);
  });

  if (start === -1) {
    throw new Error(`no section for ${version} in the changelog`);
  }

  const rest = lines.slice(start + 1);
  const end = rest.findIndex((line) => line.startsWith("## "));

  return `${(end === -1 ? rest : rest.slice(0, end)).join("\n").trim()}\n`;
}
