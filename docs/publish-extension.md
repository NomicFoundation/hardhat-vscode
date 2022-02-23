# Instruction how to publish extension

To publish `ytidilos` you need to do next steps:

1.  Checkout to `ytidilos` [`git checkout ytidilos`]
2.  Merge `main` to `ytidilos` [`git merge main`]
3.  Increase version in `package.json` and push it.
4.  Run the package command to generate the vsix file in the project root: `yarn package`
5.  We can test `.vsix` file by installing it manually in VSCode.\
    ![image](images/publish_extension_step_1.png)
6.  Go to https://marketplace.visualstudio.com/manage/publishers/ylrednet and click on 3 dots.\
    ![image](images/publish_extension_step_2.png)
7.  Click on `Update` and find `.vsix` you want to release and click on `Upload`, and that's it, the new version was published. 🎉🎉🎉
