/**
 * `--repo` for a `gh` call. In Actions the repository comes from the
 * environment; run locally, `gh` infers it from the checkout's remote, which
 * is what makes a dry run work outside CI.
 */
export function repoArgs(): string[] {
  const repository = process.env.GITHUB_REPOSITORY;

  return repository === undefined || repository === ""
    ? []
    : ["--repo", repository];
}
