# Instruction how to publish extension

To publish `hardhat-solidity` you need to do next steps:

1. `git fetch`, Checkout out `development`, then ensure your branch is up to date `git pull --ff-only`
2. Run a full check, stopping on failure: `yarn fullcheck`, you can check that each commit meets our build requirements with: `git rebase main --exec "yarn && yarn fullcheck"`
3. Confirm the commits represent the features for the release
4. Branch into a release branch named for the current date: `git checkout -b release/yyyy-mm-dd`
5. Update the package version based on semver
6. Update the changelog by adding a new entry for the new version based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
7. Commit the package version and changelog change as a version bump commit:

```
chore: bump version to v0.x.x

Update the package version and changelog for the `0.x.x - yyyy-mm-dd`
release.
```
8. Push the release branch and open a pull request using the new changelog entry as the PR description
9. Generate a release candidate vsix file with `yarn package`, the vsix file should appear in the root of the repo with the new version number
10. Manually run smoke tests on the new features across:
  - mac os x
  - windows
  - vscode running against docker
11. On a successful check, `rebase merge` the release branch into main
12. Switch to main branch and pull the latest changes
13. Git tag the version, `g tag -a v0.x.x -m "v0.x.x"` and push the tag `git push --follow-tags`
14. Upload the vsix file to the microsoft marketplace
15. Upload the vsix file to openvsx, `npx ovsx publish hardhat-solidity-0.5.0.vsix -p zzzzzz-zzzz-zzzzzz`
16. Rebase `development` onto `main`, and force push back to github
17. Update the discord announcements channel
