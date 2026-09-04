import { run } from "../../utils/process.ts";

/**
 * Update the packages versions and changelogs for the release based on the changesets.
 *
 * This is the command `changesets/action` runs to produce the Version Packages PR's contents.
 */
export function updateVersionsForRelease(): void {
  // delegate to changeset for versioning/changelog
  run("pnpm", ["changeset", "version"]);

  run("pnpm", ["install", "--frozen-lockfile", "--lockfile-only"]);
}
