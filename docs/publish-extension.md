# Instruction how to publish extension

To publish `hardhat-for-visual-studio-code` you need to do next steps:

1.  Checkout out `main`
2.  Run install, build, lint and test: `yarn && yarn build && yarn lint && yarn test`, stop on failure
3.  Increase version in `package.json` and push to git.
4.  Run the package command to generate the `vsix` file in the project root: `yarn package`
5.  We can test `.vsix` file by installing it manually in VSCode.\
    ![image](images/publish_extension_step_1.png)
6.  Go to https://marketplace.visualstudio.com/manage/publishers/nomicfoundation and click on 3 dots.\
    ![image](images/publish_extension_step_2.png)
7.  Click on `Update` and find `.vsix` you want to release and click on `Upload`, and that's it, the new version was published. 🎉🎉🎉
