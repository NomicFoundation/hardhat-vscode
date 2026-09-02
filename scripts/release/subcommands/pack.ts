import { publishedPackages, releaseVersion } from "../utils/packages.ts";
import { setOutput } from "../utils/outputs.ts";
import { run } from "../utils/process.ts";

/**
 * Builds everything a release publishes, and decides whether there is a
 * release to make at all.
 *
 * The dry-run publish is what answers that question: pnpm reports the packages
 * whose version is not on the registry yet. `hasPackages` gates every job
 * downstream; `version` is the extension's, which is what the release is
 * tagged and named after.
 */
export function pack(): boolean {
  run("pnpm", [
    "publish",
    "--filter",
    "./server",
    "--filter",
    "./coc",
    "--no-git-checks",
    "--access",
    "public",
    "--dry-run",
    "--report-summary",
  ]);

  const packages = publishedPackages();

  setOutput("version", releaseVersion());

  if (packages.length === 0) {
    console.log("No packages to publish.");

    setOutput("hasPackages", "false");

    return false;
  }

  console.log(
    `To publish: ${packages.map((p) => `${p.name}@${p.version}`).join(", ")}`
  );
  setOutput("hasPackages", "true");

  // `--filter` takes an exact package name, so there is no risk of one name
  // matching another.
  for (const { name } of packages) {
    run("pnpm", [
      "pack",
      "-r",
      "--filter",
      name,
      "--pack-destination",
      "tarballs",
    ]);
  }

  run("pnpm", ["run", "package"]);

  return true;
}
