# vscode-solidity-languageservice
The _vscode-solidity-languageservice_ contains the language smarts behind the solidity editing experience of Visual Studio Code.

### Todo
 - *doValidation* analyses an input string and returns syntax and lint errors.
 - *doHover* provides a hover text for a given location.
 - *doCodeActions* evaluates code actions for the given location, typically to fix a problem.

### Done
 - *findDefinition* finds the definition of the symbol at the given location.
 - *findTypeDefinition* finds the type definition of the symbol at the given location.
 - *findReferences* finds all references to the symbol at the given location.
 - *findImplementation* finds all implementations to the symbol at the given location.
 - *doRename* renames all symbols connected to the given location.
 - *doComplete* provides completion proposals for a given location.


## Developing

### Setup

1) Install [node](https://nodejs.org/en/).
2) Clone the repository, run `yarn && yarn run compile`, and open VS Code:

    ```bash
    git clone https://github.com/Tenderly/vscode-solidity.git
    cd vscode-solidity
    yarn && yarn run compile
    code .
    ```

### Run

To run the extension with your patch, open the Run view (`Ctrl+Shift+D`), select `Launch Client`, and click the Play button (`F5`). \
![image](https://github.com/Tenderly/vscode-solidity/blob/main/docs/images/run_launch_client.png?raw=true)

This will open a new VS Code window with the title `[Extension Development Host]`. You can then open a folder that contains Solidity code and try out your changes.

You can also set breakpoints to debug your change.

If you make subsequent edits in the codebase, you can reload (`Ctrl+R`) the `[Extension Development Host]` instance of VS Code, which will load the new code.

### Debug

Debugging the client code is as easy as debugging a normal extension. Set a breakpoint in the client code and debug the extension by running `Launch Client`.

Since the server is started by the `LanguageClient` running in the extension (client), we need to attach a debugger to the running server.

To do this, you need:
1. Go to the Run view and choose the `Attach to Server` configuration. \
![image](https://github.com/Tenderly/vscode-solidity/blob/main/docs/images/run_attach_to_server.png?raw=true)
2. Add breakpoints as needed.
3. Before starting the `Attach to Server` configuration make sure that `Launch Client` is already started.
4. Start debugging (`F5`) or play button.
5. This will attach the debugger to the server and the breakpoints will be applied to them.

**Note**: Breakpoints need to be in the server directory because we attach to the server and only server breakpoints will be visible for us.

## Test

Tests in [testFixture](./client/src/test/testFixture/) directory are End-to-End tests. The benefit of this approach is that it runs the test by instantiating a VS Code instance with a workspace, opening the file, activating the Language Client / Server, and running VS Code commands.

You can run End-to-End tests in two way:

1. Open the Run view (`Ctrl+Shift+D`), select `Language Server E2E Test`, and click the Play button (`F5`). \
![image](https://github.com/Tenderly/vscode-solidity/blob/main/docs/images/run_e2e_test.png?raw=true)

2. Or run `yarn run client-test` in command-line.
