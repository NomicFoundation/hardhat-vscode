import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const CHANGESET_DIR = ".changeset";

export const RELEASED_PACKAGES = [
  "hardhat-solidity",
  "@nomicfoundation/solidity-language-server",
  "@nomicfoundation/coc-solidity",
];

/**
 * Fails when a changeset does not name all three released packages, names them
 * with different bump types, or asks for a major bump.
 */
export function validate(): void {
  const changesets = readChangesets();

  if (changesets.length === 0) {
    console.log("No changesets to validate.");
    return;
  }

  const problems = changesets.flatMap(({ file, bumps }) =>
    problemsWith(bumps).map((problem) => `${file}: ${problem}`)
  );

  if (problems.length > 0) {
    throw new Error(
      [
        `${problems.length} problem(s) in ${changesets.length} changeset(s):`,
        ...problems.map((problem) => `  ${problem}`),
        "",
        "Every changeset must name all three released packages with the same",
        "bump, because they are a `fixed` group and are released together:",
        ...RELEASED_PACKAGES.map((name) => `  "${name}": patch|minor`),
      ].join("\n")
    );
  }

  console.log(`${changesets.length} changeset(s) name all three packages.`);
}

interface Changeset {
  file: string;
  bumps: Map<string, string>;
}

function readChangesets(): Changeset[] {
  return readdirSync(CHANGESET_DIR)
    .filter((entry) => entry.endsWith(".md") && entry !== "README.md")
    .sort()
    .map((entry) => ({
      file: path.join(CHANGESET_DIR, entry),
      bumps: parseBumps(
        path.join(CHANGESET_DIR, entry),
        readFileSync(path.join(CHANGESET_DIR, entry), "utf8")
      ),
    }));
}

/**
 * The package/bump pairs in a changeset's frontmatter. Hand-rolled rather than
 * pulling in a YAML parser: the frontmatter changesets writes is one
 * `"name": bump` per line, and anything else is a mistake worth failing on.
 */
export function parseBumps(
  file: string,
  contents: string
): Map<string, string> {
  const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(contents);

  if (match === null) {
    throw new Error(`${file}: no frontmatter`);
  }

  const bumps = new Map<string, string>();

  for (const line of match[1].split("\n")) {
    if (line.trim() === "") {
      continue;
    }

    const bump = /^\s*["']?(.+?)["']?\s*:\s*(major|minor|patch)\s*$/.exec(line);

    if (bump === null) {
      throw new Error(`${file}: cannot read frontmatter line: ${line.trim()}`);
    }

    bumps.set(bump[1], bump[2]);
  }

  return bumps;
}

/** What is wrong with one changeset's bumps, if anything. */
export function problemsWith(bumps: Map<string, string>): string[] {
  const problems: string[] = [];

  const missing = RELEASED_PACKAGES.filter((name) => !bumps.has(name));

  if (missing.length > 0) {
    problems.push(`does not name ${missing.join(", ")}`);
  }

  const unknown = [...bumps.keys()].filter(
    (name) => !RELEASED_PACKAGES.includes(name)
  );

  if (unknown.length > 0) {
    problems.push(`names unknown package(s) ${unknown.join(", ")}`);
  }

  const major = RELEASED_PACKAGES.filter((name) => bumps.get(name) === "major");

  if (major.length > 0) {
    problems.push(
      "asks for a major bump; taking the extension to its next major is a decision to make deliberately, not one to fall out of a changeset"
    );
  }

  const types = new Set(
    RELEASED_PACKAGES.map((name) => bumps.get(name)).filter(
      (type) => type !== undefined
    )
  );

  if (missing.length === 0 && types.size > 1) {
    problems.push(`mixes bump types (${[...types].sort().join(", ")})`);
  }

  return problems;
}
