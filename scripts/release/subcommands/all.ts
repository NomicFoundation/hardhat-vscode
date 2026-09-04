import { pack } from "./pack.ts";
import { publish } from "./publish.ts";
import { tag } from "./tag.ts";
import { review } from "./review.ts";
import { run } from "../utils/process.ts";

/**
 * Runs the whole release end to end locally for testing. Nothing is published.
 *
 * This command is for local testing of the release process. It replicates the
 * steps the CI follows, but does dry runs or swaps out logging for actual
 * publishing, tagging and Github releasing.
 */
export async function all({ dryRun }: { dryRun: boolean }): Promise<void> {
  if (!dryRun) {
    throw new Error(
      "`all` only ever runs as a dry run; pass --dry-run. A real release goes through the workflow, so that the publish gate is not skipped."
    );
  }

  if (process.env.GITHUB_ACTIONS === "true") {
    throw new Error(
      "`all` is for rehearsing a release locally. In Actions, run the subcommands as their own jobs so the publish gate applies."
    );
  }

  banner();

  step("build");
  run("pnpm", ["run", "build"]);

  step("pack");

  if (!pack()) {
    console.log("");
    console.log("Nothing to release; stopping here.");

    return;
  }

  step("review");
  await review();

  step("publish");
  publish({ dryRun });

  step("tag");
  tag({ dryRun });

  console.log("");
  banner();
}

function banner(): void {
  console.log("┌──────────────────────────────────────────────────────────┐");
  console.log("│  DRY RUN — nothing is published, tagged or released.     │");
  console.log("│  Steps that cannot be rehearsed print what they would    │");
  console.log("│  have done, marked [dry run].                            │");
  console.log("└──────────────────────────────────────────────────────────┘");
  console.log("");
}

function step(name: string): void {
  console.log("");
  console.log(`=== ${name} ===`);
  console.log("");
}
