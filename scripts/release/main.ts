import { parseArgs } from "node:util";
import { all } from "./subcommands/all.ts";
import { pack } from "./subcommands/pack.ts";
import { setAsDraft } from "./subcommands/prepare-release-pr/set-as-draft.ts";
import { updateVersionsForRelease } from "./subcommands/prepare-release-pr/update-versions-for-release.ts";
import { publish } from "./subcommands/publish.ts";
import { tag } from "./subcommands/tag.ts";
import { review } from "./subcommands/review.ts";

const USAGE = `Usage: node scripts/release/main.ts <command> [--dry-run]

Release stages, one per job of the release workflow, in order:
  pack       Work out what needs publishing, then pack the tarballs and the vsix
  review     Diff the tarballs and the vsix against what is already released
  publish    Publish to npm, the Visual Studio Marketplace and Open VSX
  tag        Tag the release and create it on GitHub
  all        Rehearse all four locally (requires --dry-run)

Keeping the Version Packages PR up to date, the other half of the workflow,
which never runs in the same job as a release:
  prepare-release-pr:update-versions-for-release
             Apply the changesets: bump the versions, write the changelogs
  prepare-release-pr:set-as-draft
             Convert the PR to a draft, so that a person has to mark it ready
             — which is what triggers its checks

Options:
  --dry-run  Publish nothing and tag nothing. npm is genuinely dry-run;
             the marketplaces, the tag and the GitHub release have no dry run
             of their own, so they are skipped and reported instead.

Examples:
  Rehearse the whole release in one go:

    pnpm release all --dry-run

  Builds, packs the tarballs and the vsix, diffs them against what is already
  released, then dry-run publishes and dry-run tags. Nothing leaves the
  machine. --dry-run is required, and \`all\` refuses to run in Actions, because
  it walks past the approval that the workflow puts between review and publish.

  The same thing a stage at a time, which is what the workflow does — one job
  per command, with a chance to read the output of each:

    pnpm run build                   # pack assumes a built tree
    pnpm release pack                # tarballs/ and the vsix, and whether
                                     # there is anything to release at all
    pnpm release review              # the diffs a reviewer reads
    pnpm release publish --dry-run   # npm dry-run; marketplaces reported
    pnpm release tag --dry-run       # the tag and release it would create

  Drop --dry-run from those last two and they publish and tag for real. In a
  release that only happens in Actions, once the publish environment's
  reviewers have approved.
`;

async function main(argv: string[]): Promise<void> {
  const { values, positionals } = parseArgs({
    args: argv,
    options: { "dry-run": { type: "boolean", default: false } },
    allowPositionals: true,
  });

  const [command, ...rest] = positionals;
  const dryRun = values["dry-run"];

  if (command === undefined || rest.length > 0) {
    console.log(USAGE);

    process.exitCode = command === undefined ? 0 : 1;

    return;
  }

  switch (command) {
    case "prepare-release-pr:update-versions-for-release":
      return updateVersionsForRelease();
    case "prepare-release-pr:set-as-draft":
      return setAsDraft();
    case "pack":
      pack();
      return;
    case "review":
      return review();
    case "publish":
      return publish({ dryRun });
    case "tag":
      return tag({ dryRun });
    case "all":
      return all({ dryRun });
    default:
      console.log(`Unknown command: ${command}\n`);
      console.log(USAGE);

      process.exitCode = 1;
  }
}

try {
  await main(process.argv.slice(2));
} catch (error) {
  console.error(error instanceof Error ? error.message : error);

  process.exitCode = 1;
}
