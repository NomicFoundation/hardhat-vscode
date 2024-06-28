# Instructions on how to publish extension

To publish `hardhat-solidity` you need to do next steps:

1. `git fetch`, Checkout out `development`, then ensure your branch is up to date `git pull --ff-only`
2. Perform a clean install and build (will lose all uncommitted changes):

   ```sh
   git clean -fdx .
   npm install
   npm run build
   ```

3. Run a full check, stopping on failure: `npm run fullcheck`, optionally you can check that each commit meets our build requirements with: `git rebase main --exec "npm install && npm run fullcheck"`
4. Confirm the commits represent the features for the release
5. Branch into a release branch named for the current date: `git checkout -b release/yyyy-mm-dd`
6. Update the version based on semver, ensure it is updated in:

   - the client `./client/package.json`
   - the language server package.json `./server/package.json`
   - the coc extension package.json, both its version and its dep on the language server, at `./coc/package.json`

7. Update the changelog in `./client/CHANGELOG.md` by adding a new entry for the new version based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
8. Commit the package version and changelog change as a version bump commit:

   ```git
   chore: bump version to v0.x.x

   Update the package version and changelog for the `0.x.x - yyyy-mm-dd`
   release.
   ```

9. Push the release branch and open a pull request against `main` using the new changelog entry as the PR description

10. Ensure .env file is populated with GA and Sentry secrets before packaging (see `./env.example`)

11. Generate a release candidate vsix file with `npm run package`, the vsix file should appear in the `./client` folder with the new version number

12. Manually run smoke tests on the new features across all supported platforms, using contracts from <https://github.com/NomicFoundation/smoke-tests-vscode>:

    - mac os x
    - windows
    - linux (vscode running against docker)

13. Ensure that metrics are reported correctly in both Google Analytics and Sentry for the new version.
14. On a successful check, `rebase merge` the PR into `main` branch.
15. Switch to main branch and pull the latest changes
16. Git tag the version, `git tag -a v0.x.x -m "v0.x.x"` and push the tag `git push --follow-tags`
17. Publish the language server npm package, `cd ./server && npm publish`
18. Publish the coc extension, `cd ./coc && npm publish --non-interactive`
19. Upload the vsix file to the microsoft marketplace: `npx vsce publish -p $VSCE_TOKEN --packagePath client/hardhat-solidity-0.X.X.vsix`
20. Upload the vsix file to openvsx, `npx ovsx publish client/hardhat-solidity-0.X.X.vsix -p $OVSX_TOKEN`
21. Create a release on github off of the pushed tag

    - use the added changelog section as the body of the release
    - upload the vsix file as an asset.
    - append the Nomic is Hiring section to the end of the release note:

    ```markdown
    ---
    > 💡 **The Nomic Foundation is hiring! Check [our open positions](https://www.nomic.foundation/jobs).**
    ---
    ```

22. Rebase `development` onto `main`, and force push back to github
23. Update the discord announcements channel

    - link to the release entry on github (i.e. `https://github.com/NomicFoundation/hardhat-vscode/releases/tag/v0.x.x`)
    - give a few sentences of description of why users should be excited about this release
