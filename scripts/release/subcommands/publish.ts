import path from "node:path";
import { publishedPackages, tarballName, vsixPath } from "../utils/packages.ts";
import {
  readRequiredEnvVariable,
  run,
  prefixDryRun,
} from "../utils/process.ts";

const VSCE = "@vscode/vsce@3.9.2";
const OVSX = "ovsx@1.1.1";

/**
 * Publishes the artifacts `pack` built: the tarballs to npm, the vsix to both
 * marketplaces.
 */
export function publish({ dryRun }: { dryRun: boolean }): void {
  const packages = publishedPackages();

  for (const pkg of packages) {
    const tarball = tarballName(pkg);
    console.log(`Publishing ${tarball}`);

    run(
      "npm",
      [
        "publish",
        tarball,
        "--tag",
        "latest",
        "--access",
        "public",
        ...(dryRun ? ["--dry-run"] : []),
      ],
      { cwd: path.resolve("tarballs") }
    );
  }

  const vsix = vsixPath();

  if (dryRun) {
    prefixDryRun(`publish ${vsix} to the Visual Studio Marketplace`, [
      "npx",
      "--yes",
      VSCE,
      "publish",
      "--packagePath",
      vsix,
      "-p",
      "***",
    ]);

    prefixDryRun(`publish ${vsix} to Open VSX`, [
      "npx",
      "--yes",
      OVSX,
      "publish",
      vsix,
      "-p",
      "***",
    ]);

    return;
  }

  const vsceToken = readRequiredEnvVariable("VSCE_TOKEN");
  const ovsxToken = readRequiredEnvVariable("OVSX_TOKEN");

  run(
    "npx",
    ["--yes", VSCE, "publish", "--packagePath", vsix, "-p", vsceToken],
    { secrets: [vsceToken] }
  );

  run("npx", ["--yes", OVSX, "publish", vsix, "-p", ovsxToken], {
    secrets: [ovsxToken],
  });
}
