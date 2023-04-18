# Instructions on how to publish extension

To publish `hardhat-solidity` you need to do next steps:

1. `git fetch`, Checkout out `development`, then ensure your branch is up to date `git pull --ff-only`
2. Perform a clean install and build (will lose all uncommitted changes) `git clean -fdx .`, `npm install`, `npm run build`
3. Run a full check, stopping on failure: `npm run fullcheck`, you can check that each commit meets our build requirements with: `git rebase main --exec "npm install && npm run fullcheck"`
4. Confirm the commits represent the features for the release
5. Branch into a release branch named for the current date: `git checkout -b release/yyyy-mm-dd`
6. Update the version based on semver, ensure it is updated in:

- the client `./client/package.json`
- the language server package.json `./server/package.json`
- the coc extension package.json, both its version and its dep on the language server, at `./coc/package.json`

7. Update the changelog by adding a new entry for the new version based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
8. Commit the package version and changelog change as a version bump commit:

```
chore: bump version to v0.x.x

Update the package version and changelog for the `0.x.x - yyyy-mm-dd`
release.
```

9. Push the release branch and open a pull request using the new changelog entry as the PR description
10. Generate a release candidate vsix file with `npm run package`, the vsix file should appear in the `./client` folder with the new version number
11. Manually run smoke tests on the new features across:

- mac os x
- windows
- vscode running against docker

12. On a successful check, `rebase merge` the release branch into main
13. Switch to main branch and pull the latest changes
14. Git tag the version, `g tag -a v0.x.x -m "v0.x.x"` and push the tag `git push --follow-tags`
15. Publish the language server npm package, `cd ./server && npm publish`
16. Publish the coc extension, `cd ./coc && npm publish --non-interactive`
17. Upload the vsix file to the microsoft marketplace: `npx vsce publish -p $VSCE_TOKEN --packagePath client/hardhat-solidity-0.X.X.vsix`
18. Upload the vsix file to openvsx, `npx ovsx publish client/hardhat-solidity-0.X.X.vsix -p $OVSX_TOKEN`
19. Create a release on github off of the pushed tag

- use the added changelog section as the body of the release
- upload the vsix file as an asset

18. Rebase `development` onto `main`, and force push back to github
19. Update the discord announcements channel

- link to the release entry on github (i.e. `https://github.com/NomicFoundation/hardhat-vscode/releases/tag/v0.x.x`)
- give a few sentences of description of why users should be excited about this release
