import { repoArgs } from "../../utils/github.ts";
import { capture, run } from "../../utils/process.ts";

const HEAD_BRANCH = "changeset-release/main";

interface PullRequest {
  number: number;
  isDraft: boolean;
}

/**
 * Converts the Version Packages PR to a draft, so that a person has to mark it
 * ready for review — which is what triggers its checks. A PR opened by an
 * action does not trigger them on its own.
 */
export function setAsDraft(): void {
  const pr = openReleasePr();

  if (pr === undefined) {
    throw new Error(`no open PR from ${HEAD_BRANCH}`);
  }

  if (pr.isDraft) {
    console.log(`#${pr.number} is already a draft`);

    return;
  }

  run("gh", ["pr", "ready", "--undo", String(pr.number), ...repoArgs()]);
}

function openReleasePr(): PullRequest | undefined {
  const found: PullRequest[] = JSON.parse(
    capture("gh", [
      "pr",
      "list",
      ...repoArgs(),
      "--head",
      HEAD_BRANCH,
      "--state",
      "open",
      "--json",
      "number,isDraft",
    ])
  );

  return found[0];
}
