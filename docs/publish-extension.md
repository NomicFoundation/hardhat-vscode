# Releasing

Releases are cut by the [release workflow](../.github/workflows/release.yml). It builds the artifacts, waits for a member of the team to approve, and then publishes to npm, both marketplaces and GitHub.

Three packages go out together, on one version: the `hardhat-solidity` extension as a vsix, and `@nomicfoundation/solidity-language-server` and `@nomicfoundation/coc-solidity` to npm.

## Describing a change

Every PR that changes one of those packages carries a changeset:

```sh
pnpm changeset add
```

Name **all three** packages with the same bump, `patch` or `minor` — they are a `fixed` group in `.changeset/config.json`, so one changeset releases all of them, and a changeset that names only the server leaves the other two with a changelog entry saying nothing but "Updated dependencies". `major` is rejected: taking the extension to its next major is a decision to make deliberately rather than one to fall out of a changeset. `pnpm release:validate` checks this, and CI runs it on every PR. Write the entry for the person reading the changelog. CI fails a PR that needs one and does not have it; label the PR `no changeset needed` for the ones that genuinely do not, like a CI or docs change.

## Cutting a release

1. **Merge the Version Packages PR.** The release workflow keeps it open and up to date while changesets accumulate on `main`. It applies them, moves all three packages to the next version, and writes the changelogs. Merging it is the decision to release.
2. **Approve the deployment.** Merging that PR starts a run that builds the tarballs and the vsix, diffs them against what is already published, and then waits on the `publish` environment. Approving is what says a release was intended — you can download the vsix from the run and try it first, but that is optional.
3. **Announce it** in the Discord announcements channel, linking the release and saying what is worth knowing about it.

That is the whole flow. The run then publishes both npm packages, uploads the vsix to the Visual Studio Marketplace and Open VSX, tags `vX.Y.Z`, and creates the GitHub release with the vsix attached.

## The release scripts

Each job in the workflow is one subcommand of `scripts/release/main.ts`. The four release stages:

```sh
pnpm release pack       # decide what needs publishing, pack the tarballs and the vsix
pnpm release review     # diff them against what is already released
pnpm release publish    # npm, the Visual Studio Marketplace, Open VSX
pnpm release tag        # tag it, and create the GitHub release
```

The other three keep the Version Packages PR up to date and never run in the same job as a release: `prepare-release-pr:update-versions-for-release` applies the changesets — that is `pnpm release:version`, which is what `changesets/action` runs — `prepare-release-pr:set-as-draft` converts the PR to a draft, and `prepare-release-pr:validate` — `pnpm release:validate` — checks the changesets.

`pnpm release all --dry-run` runs the four stages locally against the current working tree. `--dry-run` is not optional and `all` refuses to run in Actions: it walks past the approval gate by design, and that gate is the point of the workflow. npm is genuinely dry-run; neither marketplace has one, and a tag and a GitHub release are not things to rehearse, so those four say what they would have done and do nothing.

## If something goes wrong

Everything downstream of `pack` uses the artifacts from that one build, so a failure part way through leaves a run you can inspect rather than a half-built release. Publishing is not idempotent, though: rerunning a failed `publish` job will try to publish versions that already exist. Check what actually landed on npm and the marketplaces before rerunning anything.

## What is not automated

- The Discord announcement.
- Whatever manual testing you want to do before approving.

## Credentials

Held by the repository, not by people:

- `SOLIDITY_GA_SECRET`, `SOLIDITY_GOOGLE_TRACKING_ID`, `SOLIDITY_SENTRY_DSN` — inlined into the bundle when the artifacts are built.
- `VSCE_TOKEN`, `OVSX_TOKEN` — on the `publish` environment, so they are only reachable after the approval.
- `RELEASE_GITHUB_TOKEN` — lets the Version Packages PR trigger its own checks.

npm needs no token: publishing uses Trusted Publishing, which authenticates the workflow itself.
