# Instruction how to publish extension
To publish `ytidilos` you need to do next steps:
1.  Checkout to `ytidilos` [`git checkout ytidilos`]
2.  Merge `main` to `ytidilos` [`git merge main`]
3.  Increase version in `package.json` and push it.
4.  Run `vsce package --yarn` that will generate you `.vsix` file in root of project.\
Due to the fast releases that `vsce` makes, it is recommended to update the package before running the `4.`\
`npm install -g vsce`
5.  We can test `.vsix` file by installing it manually in VSCode.\
![image](https://github.com/Tenderly/vscode-solidity/blob/main/docs/images/publish_extension_step_1.png?raw=true)
6.  Go to https://marketplace.visualstudio.com/manage/publishers/ylrednet and click on 3 dots.\
![image](https://github.com/Tenderly/vscode-solidity/blob/main/docs/images/publish_extension_step_2.png?raw=true)
7.  Click on `Update` and find `.vsix` you want to release and click on `Upload`, and that's it, the new version was published. 🎉🎉🎉
