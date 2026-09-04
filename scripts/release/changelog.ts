/**
 * The changelog generator, which is changesets' default one with the
 * "Updated dependencies" lines removed.
 *
 * Those lines exist for a repo where one package's release drags another's
 * along. Ours are a `fixed` group and every changeset names all three
 * (enforced by `prepare-release-pr:validate`), so each package already lists
 * the real entries — and the dependency lines then repeat every one of them by
 * commit hash, which is the bulk of the GitHub release body.
 *
 * `.changeset/config.json` points at this file. Changesets loads it with a
 * dynamic `import()`, so Node's type stripping applies.
 */
import defaultChangelog from "@changesets/cli/changelog";

export default {
  getReleaseLine: defaultChangelog.getReleaseLine,

  // An empty line is dropped rather than rendered, so this removes the
  // "### Patch Changes" heading too when there is nothing else under it.
  getDependencyReleaseLine: async () => "",
};
